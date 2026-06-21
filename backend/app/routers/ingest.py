from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user
from app.services.rag_service import ingest_pdf, ingest_url as _ingest_url

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def _can_ingest(collection_id: str, user_id: str) -> bool:
    if not collection_id:
        return True
    own = _db.table("collections").select("id").eq("id", collection_id).eq("user_id", user_id).execute()
    if own.data:
        return True
    member = _db.table("collection_members").select("permission").eq("collection_id", collection_id).eq("user_id", user_id).execute()
    if member.data and member.data[0]["permission"] == "ingest":
        return True
    return False


class UrlIngestRequest(BaseModel):
    url: str
    collection_id: str = ""


@router.post("/")
async def ingest(
    file: UploadFile = File(...),
    collection_id: str = Query(default=""),
    user: dict = Depends(get_current_user),
):
    if not _can_ingest(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Ingest permission required")
    return await ingest_pdf(file, namespace=collection_id)


@router.post("/url")
async def ingest_from_url(request: UrlIngestRequest, user: dict = Depends(get_current_user)):
    if not _can_ingest(request.collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Ingest permission required")
    return await _ingest_url(request.url, namespace=request.collection_id)
