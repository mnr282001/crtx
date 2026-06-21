from fastapi import APIRouter, File, Query, UploadFile
from pydantic import BaseModel
from app.services.rag_service import ingest_pdf, ingest_url

router = APIRouter()


class UrlIngestRequest(BaseModel):
    url: str
    collection_id: str = ""


@router.post("/")
async def ingest(
    file: UploadFile = File(...),
    collection_id: str = Query(default=""),
):
    return await ingest_pdf(file, namespace=collection_id)


@router.post("/url")
async def ingest_from_url(request: UrlIngestRequest):
    return await ingest_url(request.url, namespace=request.collection_id)
