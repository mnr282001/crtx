import time
from typing import Optional

from fastapi import HTTPException
from pinecone import Pinecone

from app.config import (
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
    PINECONE_API_KEY,
    PINECONE_INDEX,
    TOP_K,
)


def ask_question_llamaindex(question: str, namespace: str = "", config: Optional[dict] = None) -> dict:
    try:
        from llama_index.core import Settings, VectorStoreIndex
        from llama_index.embeddings.openai import OpenAIEmbedding
        from llama_index.llms.openai import OpenAI as LlamaOpenAI
        from llama_index.vector_stores.pinecone import PineconeVectorStore
    except (ImportError, TypeError) as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "LlamaIndex could not be loaded. "
                "Ensure llama-index-core<0.12.0 is installed for Python 3.9 compatibility: "
                "pip install 'llama-index-core<0.12.0' 'llama-index-vector-stores-pinecone<0.4.0' "
                "'llama-index-llms-openai<0.3.0' 'llama-index-embeddings-openai<0.3.0'"
            ),
        ) from e

    config = config or {}
    top_k = config.get("top_k", TOP_K)

    Settings.llm = LlamaOpenAI(model="gpt-4o-mini")
    Settings.embed_model = OpenAIEmbedding(
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIMENSIONS,
    )

    pc = Pinecone(api_key=PINECONE_API_KEY)
    pinecone_index = pc.Index(PINECONE_INDEX)

    vector_store = PineconeVectorStore(
        pinecone_index=pinecone_index,
        namespace=namespace or "",
    )

    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=top_k)

    t0 = time.monotonic()
    response = query_engine.query(question)
    total_ms = int((time.monotonic() - t0) * 1000)

    sources = []
    for node in getattr(response, "source_nodes", []):
        sources.append({
            "source": node.metadata.get("source", ""),
            "chunk_index": node.metadata.get("chunk_index", 0),
            "text": node.get_content(),
            "score": node.score or 0.0,
        })

    return {
        "answer": str(response),
        "sources": sources,
        "_retrieval_ms": 0,
        "_generation_ms": total_ms,
    }
