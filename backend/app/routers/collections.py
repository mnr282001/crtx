import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_STORE = Path(__file__).resolve().parent.parent / "collections.json"


def _load() -> list:
    if _STORE.exists():
        return json.loads(_STORE.read_text())
    return []


def _save(collections: list) -> None:
    _STORE.write_text(json.dumps(collections))


class CreateCollectionRequest(BaseModel):
    name: str


@router.post("/")
def create_collection(req: CreateCollectionRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    collections = _load()
    col = {"id": str(uuid.uuid4()), "name": req.name.strip()}
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
