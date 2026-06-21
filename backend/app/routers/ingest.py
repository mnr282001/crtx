import os
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user
from app.services.rag_service import ingest_pdf_from_bytes, ingest_url as _ingest_url

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

    pdf_bytes = await file.read()
    file_name = os.path.basename(file.filename or "document.pdf")

    result = await ingest_pdf_from_bytes(pdf_bytes, file_name, namespace=collection_id)

    if collection_id:
        storage_path = f"{collection_id}/{file_name}"
        try:
            _db.storage.from_("documents").upload(
                path=storage_path,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf", "upsert": "true"},
            )
        except Exception:
            storage_path = None

        _db.table("collection_documents").insert({
            "collection_id": collection_id,
            "name": file_name,
            "source_type": "pdf",
            "storage_path": storage_path,
            "chunk_count": result["chunks"],
            "uploaded_by": user["sub"],
        }).execute()

    return result


@router.post("/url")
async def ingest_from_url(request: UrlIngestRequest, user: dict = Depends(get_current_user)):
    if not _can_ingest(request.collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Ingest permission required")

    result = await _ingest_url(request.url, namespace=request.collection_id)

    if request.collection_id:
        _db.table("collection_documents").insert({
            "collection_id": request.collection_id,
            "name": request.url,
            "source_type": "url",
            "url": request.url,
            "chunk_count": result["chunks"],
            "uploaded_by": user["sub"],
        }).execute()

    return result
