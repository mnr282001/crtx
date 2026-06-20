import json
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.langchain_service import ask_question_langchain
from app.services.llamaindex_service import ask_question_llamaindex

router = APIRouter()

_STORE = Path(__file__).resolve().parent.parent / "collections.json"

_DEFAULT_CONFIG = {
    "engine": "langchain",
    "chunk_size": 1000,
    "retrieval_strategy": "similarity",
}


def _get_collection_config(collection_id: str) -> dict:
    if not collection_id or not _STORE.exists():
        return _DEFAULT_CONFIG.copy()
    collections = json.loads(_STORE.read_text())
    for col in collections:
        if col["id"] == collection_id:
            return {**_DEFAULT_CONFIG, **col.get("config", {})}
    return _DEFAULT_CONFIG.copy()


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
