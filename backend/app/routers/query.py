from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user
from app.services.langchain_service import ask_question_langchain
from app.services.llamaindex_service import ask_question_llamaindex

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

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


@router.post("/")
def query(request: QueryRequest, user: dict = Depends(get_current_user)):
    if request.collection_id and not _can_query(request.collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    config = _get_collection_config(request.collection_id)
    engine = request.pipeline or config.get("engine", "langchain")

    if engine == "llamaindex":
        return ask_question_llamaindex(
            request.question,
            namespace=request.collection_id,
            config=config,
        )

    return ask_question_langchain(
        request.question,
        namespace=request.collection_id,
        config=config,
    )
