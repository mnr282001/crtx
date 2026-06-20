import fitz
import os
from fastapi import HTTPException
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter
)
from langchain_openai import OpenAIEmbeddings
from openai import AuthenticationError, OpenAI, OpenAIError, RateLimitError
from pinecone.exceptions import PineconeApiException
from app.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
    TOP_K,
)
from app.db.vector_store import get_index


def get_openai_client():
    return OpenAI()

async def ingest_pdf(file, namespace: str = ""):

    pdf_bytes = await file.read()
    fileName = os.path.basename(file.filename)

    text = extract_pdf_text(pdf_bytes)
    chunks = chunk_text(text)
    store_chunks(chunks, fileName, namespace=namespace)

    return {
        "message": "Document ingested successfully",
        "chunks": len(chunks)
    }


def extract_pdf_text(pdf_bytes):
    doc = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    text = ""

    for page in doc:
        text += page.get_text()

    return text

def chunk_text(text):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )

    return splitter.split_text(text)


def raise_openai_http_error(error: OpenAIError):
    error_body = getattr(error, "body", None) or {}
    if not isinstance(error_body, dict):
        error_body = {}

    error_code = getattr(error, "code", None) or error_body.get("code")

    if isinstance(error, AuthenticationError):
        status_code = 401
        detail = "OpenAI authentication failed. Check OPENAI_API_KEY."
    elif isinstance(error, RateLimitError) and error_code == "insufficient_quota":
        status_code = 429
        detail = (
            "OpenAI quota exceeded. Check your OpenAI plan, billing, or usage limits."
        )
    elif isinstance(error, RateLimitError):
        status_code = 429
        detail = "OpenAI rate limit reached. Try again later."
    else:
        status_code = 502
        detail = "OpenAI request failed. Try again later."

    raise HTTPException(status_code=status_code, detail=detail) from error


def raise_pinecone_http_error(error: PineconeApiException):
    error_text = str(error)

    if "Vector dimension" in error_text and "does not match" in error_text:
        detail = (
            "Pinecone vector dimension mismatch. "
            f"Your app is configured for {EMBEDDING_DIMENSIONS}-dimensional "
            "embeddings; make sure the Pinecone index uses the same dimension."
        )
        raise HTTPException(status_code=400, detail=detail) from error

    raise HTTPException(
        status_code=502,
        detail="Pinecone request failed. Try again later."
    ) from error


def store_chunks(chunks, fileName, namespace: str = ""):
    index = get_index()

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )

    try:
        chunk_embeddings = embeddings.embed_documents(chunks)
    except OpenAIError as error:
        raise_openai_http_error(error)

    prefix = f"{namespace}-" if namespace else ""
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
        vectors.append({
            "id": f"{prefix}chunk-{i}",
            "values": embedding,
            "metadata": {
                "text": chunk,
                "source": fileName,
                "chunk_index": i
            }
        })

    kwargs = {"vectors": vectors}
    if namespace:
        kwargs["namespace"] = namespace

    try:
        index.upsert(**kwargs)
    except PineconeApiException as error:
        raise_pinecone_http_error(error)

def ask_question(question: str, namespace: str = ""):
    index = get_index()

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS
    )

    try:
        question_embedding = embeddings.embed_query(question)
    except OpenAIError as error:
        raise_openai_http_error(error)

    query_kwargs = {
        "vector": question_embedding,
        "top_k": TOP_K,
        "include_metadata": True,
    }
    if namespace:
        query_kwargs["namespace"] = namespace

    try:
        results = index.query(**query_kwargs)
    except PineconeApiException as error:
        raise_pinecone_http_error(error)

    context = "\n\n".join(
        match["metadata"]["text"]
        for match in results["matches"]
    )

    client = get_openai_client()
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Answer the user's question only "
                        "using the provided context."
                    )
                },
                {
                    "role": "user",
                    "content": f"""
                    Context:
                    {context}

                    Question:
                    {question}
                    """
                }
            ]
        )
    except OpenAIError as error:
        raise_openai_http_error(error)
    
    return {
        "answer": response.choices[0].message.content,
        "sources": [
            {
                "source": match["metadata"].get("source"),
                "chunk_index": match["metadata"].get("chunk_index"),
                "text": match["metadata"]["text"],
                "score": match["score"]
            }
        for match in results["matches"]
        ]
    }
