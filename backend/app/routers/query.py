from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_service import ask_question

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    collection_id: str = ""


@router.post("/")
def query(request: QueryRequest):
    return ask_question(request.question, namespace=request.collection_id)
