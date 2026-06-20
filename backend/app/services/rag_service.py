import fitz
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter
)
from langchain_openai import OpenAIEmbeddings
from app.db.vector_store import index

async def ingest_pdf(file):

    pdf_bytes = await file.read()

    # Step 7
    text = extract_pdf_text(pdf_bytes)

    # Step 8
    chunks = chunk_text(text)

    # Step 9 + 10
    store_chunks(chunks)

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

def chunk_documents(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_text(text)

def store_chunks(chunks):
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small"
    )

    vectors = []

    for i, chunk in enumerate(chunks):

        embedding = embeddings.embed_query(chunk)

        vectors.append({
            "id": f"chunk-{i}",
            "values": embedding,
            "metadata": {
                "text": chunk
            }
        })

    index.upsert(vectors=vectors)