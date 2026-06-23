import ipaddress
import os
import uuid
from typing import Optional
from urllib.parse import urlparse as _urlparse
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, field_validator
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def _arq(request: Request):
    pool = request.app.state.arq_pool
    if pool is None:
        raise HTTPException(status_code=503, detail="Redis unavailable — set REDIS_URL to enable ingestion")
    return pool


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


async def _enqueue(
    arq_pool,
    *,
    user_id: str,
    collection_id: str,
    document_id: Optional[str],
    source_type: str,
    source: str,
    storage_path: Optional[str] = None,
    url: Optional[str] = None,
) -> str:
    # Pre-generate the ID so we can pass it to the job function AND use it
    # as Arq's queue key via _job_id, making the ingest_jobs row insertable
    # before the job starts.
    job_id = str(uuid.uuid4())

    _db.table("ingest_jobs").insert({
        "job_id": job_id,
        "user_id": user_id,
        "collection_id": collection_id or None,
        "source": source,
        "status": "queued",
    }).execute()

    await arq_pool.enqueue_job(
        "ingest_document",
        _job_id=job_id,
        job_id=job_id,
        user_id=user_id,
        collection_id=collection_id,
        document_id=document_id,
        source_type=source_type,
        source=source,
        storage_path=storage_path,
        url=url,
    )

    return job_id


def _is_private_host(hostname: str) -> bool:
    try:
        addr = ipaddress.ip_address(hostname)
        return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved
    except ValueError:
        # hostname is a name, not an IP — allow it (DNS resolution happens in the worker)
        lowered = hostname.lower()
        return lowered in ("localhost",) or lowered.endswith(".local")


class UrlIngestRequest(BaseModel):
    url: str
    collection_id: str = ""

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        parsed = _urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("URL must use http or https")
        if not parsed.netloc:
            raise ValueError("URL must include a host")
        hostname = parsed.hostname or ""
        if _is_private_host(hostname):
            raise ValueError("URL must point to a public host")
        return v


@router.post("/")
async def ingest(
    request: Request,
    file: UploadFile = File(...),
    collection_id: str = Query(default=""),
    user: dict = Depends(get_current_user),
):
    if not _can_ingest(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Ingest permission required")

    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=415, detail="Only PDF files are accepted")

    MAX_PDF_BYTES = 50 * 1024 * 1024  # 50 MB
    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")

    file_name = os.path.basename(file.filename or "document.pdf")

    # Always upload to storage so the worker can download it
    storage_path = (
        f"{collection_id}/{file_name}" if collection_id
        else f"{user['sub']}/{file_name}"
    )
    try:
        _db.storage.from_("documents").upload(
            path=storage_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}")

    document_id: Optional[str] = None
    if collection_id:
        result = _db.table("collection_documents").insert({
            "collection_id": collection_id,
            "name": file_name,
            "source_type": "pdf",
            "storage_path": storage_path,
            "uploaded_by": user["sub"],
        }).execute()
        document_id = result.data[0]["id"]

    job_id = await _enqueue(
        _arq(request),
        user_id=user["sub"],
        collection_id=collection_id,
        document_id=document_id,
        source_type="pdf",
        source=file_name,
        storage_path=storage_path,
    )

    return {"job_id": job_id}


@router.post("/url")
async def ingest_from_url(
    request: Request,
    body: UrlIngestRequest,
    user: dict = Depends(get_current_user),
):
    if not _can_ingest(body.collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Ingest permission required")

    parsed_url = _urlparse(body.url)
    source = parsed_url.netloc + parsed_url.path

    document_id: Optional[str] = None
    if body.collection_id:
        result = _db.table("collection_documents").insert({
            "collection_id": body.collection_id,
            "name": body.url,
            "source_type": "url",
            "url": body.url,
            "uploaded_by": user["sub"],
        }).execute()
        document_id = result.data[0]["id"]

    job_id = await _enqueue(
        _arq(request),
        user_id=user["sub"],
        collection_id=body.collection_id,
        document_id=document_id,
        source_type="url",
        source=source,
        url=body.url,
    )

    return {"job_id": job_id}


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, user: dict = Depends(get_current_user)):
    result = _db.table("ingest_jobs").select("*").eq("job_id", job_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data[0]
    if job["user_id"] != user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return job
