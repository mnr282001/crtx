from fastapi import APIRouter, File, UploadFile
from app.services.rag_service import ingest_pdf

router = APIRouter()

@router.post("/")
async def ingest(file: UploadFile = File(...)):

    result = await ingest_pdf(file)

    return result
