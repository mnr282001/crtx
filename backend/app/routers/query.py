from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client
from openai import OpenAI

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY, OPENAI_API_KEY
from app.auth import get_current_user
from app.services.langchain_service import ask_question_langchain
from app.services.llamaindex_service import ask_question_llamaindex

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
_openai = OpenAI(api_key=OPENAI_API_KEY)

_DEFAULT_CONFIG = {
    "engine": "langchain",
    "chunk_size": 1000,
    "retrieval_strategy": "similarity",
}


def _get_collection_config(collection_id: str) -> dict:
    if not collection_id:
        return _DEFAULT_CONFIG.copy()
    res = _db.table("collections").select("config").eq("id", collection_id).execute()
    if not res.data:
        return _DEFAULT_CONFIG.copy()
    return {**_DEFAULT_CONFIG, **res.data[0].get("config", {})}


def _can_query(collection_id: str, user_id: str) -> bool:
    if not collection_id:
        return True
    own = _db.table("collections").select("id").eq("id", collection_id).eq("user_id", user_id).execute()
    if own.data:
        return True
    member = _db.table("collection_members").select("id").eq("collection_id", collection_id).eq("user_id", user_id).execute()
    return bool(member.data)


class QueryRequest(BaseModel):
    question: str
    collection_id: str = ""
    pipeline: str = ""
    session_id: str = ""


_TITLE_MAX = 40
_TITLE_SYSTEM = (
    "You generate very short chat titles. "
    f"Rules: respond with ONLY the title, no quotes, no punctuation at the end, max {_TITLE_MAX} characters."
)


def _generate_title(question: str) -> str:
    prompt = f"Generate a title for a chat that starts with this message:\n\n{question}"
    messages = [
        {"role": "system", "content": _TITLE_SYSTEM},
        {"role": "user", "content": prompt},
    ]

    for attempt in range(3):
        response = _openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=20,
            temperature=0.3,
        )
        title = response.choices[0].message.content.strip().strip('"').strip("'")
        if len(title) <= _TITLE_MAX:
            return title
        # Feed the violation back so the model self-corrects
        messages.append({"role": "assistant", "content": title})
        messages.append({
            "role": "user",
            "content": (
                f"That title is {len(title)} characters, which exceeds the {_TITLE_MAX}-character limit. "
                "Please shorten it."
            ),
        })

    # Hard fallback: truncate at word boundary
    fallback = question[:_TITLE_MAX]
    last_space = fallback.rfind(" ")
    return fallback[:last_space] if last_space > 15 else fallback


def _save_exchange(collection_id: str, user_id: str, question: str, result: dict, session_id: str):
    if not collection_id or not session_id:
        return

    existing = _db.table("chat_messages").select("id").eq("session_id", session_id).limit(1).execute()
    is_first = not existing.data

    _db.table("chat_messages").insert([
        {
            "collection_id": collection_id,
            "user_id": user_id,
            "role": "user",
            "content": question,
            "session_id": session_id,
        },
        {
            "collection_id": collection_id,
            "user_id": user_id,
            "role": "assistant",
            "content": result.get("answer", ""),
            "sources": result.get("sources"),
            "session_id": session_id,
        },
    ]).execute()

    update: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if is_first:
        try:
            update["title"] = _generate_title(question)
        except Exception:
            fallback = question[:_TITLE_MAX]
            last_space = fallback.rfind(" ")
            update["title"] = fallback[:last_space] if last_space > 15 else fallback
    _db.table("chat_sessions").update(update).eq("id", session_id).execute()


@router.post("/")
def query(request: QueryRequest, user: dict = Depends(get_current_user)):
    if request.collection_id and not _can_query(request.collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    config = _get_collection_config(request.collection_id)
    engine = request.pipeline or config.get("engine", "langchain")

    if engine == "llamaindex":
        result = ask_question_llamaindex(
            request.question,
            namespace=request.collection_id,
            config=config,
        )
    else:
        result = ask_question_langchain(
            request.question,
            namespace=request.collection_id,
            config=config,
        )

    _save_exchange(request.collection_id, user["sub"], request.question, result, request.session_id)
    return result
