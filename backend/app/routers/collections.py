import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

_STORE = Path(__file__).resolve().parent.parent / "collections.json"

_DEFAULT_CONFIG = {
    "engine": "langchain",
    "chunk_size": 1000,
    "retrieval_strategy": "similarity",
}


def _load() -> list:
    if _STORE.exists():
        return json.loads(_STORE.read_text())
    return []


def _save(collections: list) -> None:
    _STORE.write_text(json.dumps(collections))


class CreateCollectionRequest(BaseModel):
    name: str


class PipelineConfig(BaseModel):
    engine: Literal["langchain", "llamaindex"] = "langchain"
    chunk_size: int = 1000
    retrieval_strategy: Literal["similarity", "mmr", "threshold"] = "similarity"


@router.post("/")
def create_collection(req: CreateCollectionRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    collections = _load()
    col = {
        "id": str(uuid.uuid4()),
        "name": req.name.strip(),
        "config": _DEFAULT_CONFIG.copy(),
    }
    collections.append(col)
    _save(collections)
    return col


@router.get("/")
def list_collections():
    return _load()


@router.delete("/{collection_id}")
def delete_collection(collection_id: str):
    collections = _load()
    updated = [c for c in collections if c["id"] != collection_id]
    if len(updated) == len(collections):
        raise HTTPException(status_code=404, detail="Collection not found")
    _save(updated)
    return {"deleted": collection_id}


@router.get("/{collection_id}/config")
def get_collection_config(collection_id: str):
    collections = _load()
    for col in collections:
        if col["id"] == collection_id:
            return {**_DEFAULT_CONFIG, **col.get("config", {})}
    raise HTTPException(status_code=404, detail="Collection not found")


@router.put("/{collection_id}/config")
def update_collection_config(collection_id: str, config: PipelineConfig):
    collections = _load()
    for col in collections:
        if col["id"] == collection_id:
            col["config"] = config.model_dump()
            _save(collections)
            return col["config"]
    raise HTTPException(status_code=404, detail="Collection not found")
