from fastapi import APIRouter, File, Query, UploadFile
from app.services.rag_service import ingest_pdf

router = APIRouter()


@router.post("/")
async def ingest(
    file: UploadFile = File(...),
    collection_id: str = Query(default=""),
):
    return await ingest_pdf(file, namespace=collection_id)
