from fastapi import APIRouter
from pydantic import BaseModel
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
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


class QueryRequest(BaseModel):
    question: str
    collection_id: str = ""
    pipeline: str = ""


@router.post("/")
def query(request: QueryRequest):
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
