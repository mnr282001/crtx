from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

_DEFAULT_CONFIG = {
    "engine": "langchain",
    "chunk_size": 1000,
    "retrieval_strategy": "similarity",
}


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
    res = _db.table("collections").insert({"name": req.name.strip(), "config": _DEFAULT_CONFIG}).execute()
    return res.data[0]


@router.get("/")
def list_collections():
    res = _db.table("collections").select("*").order("created_at").execute()
    return res.data


@router.delete("/{collection_id}")
def delete_collection(collection_id: str):
    res = _db.table("collections").delete().eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"deleted": collection_id}


@router.get("/{collection_id}/config")
def get_collection_config(collection_id: str):
    res = _db.table("collections").select("config").eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {**_DEFAULT_CONFIG, **res.data[0].get("config", {})}


@router.put("/{collection_id}/config")
def update_collection_config(collection_id: str, config: PipelineConfig):
    res = _db.table("collections").update({"config": config.model_dump()}).eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return res.data[0]["config"]
