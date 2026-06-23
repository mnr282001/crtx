import asyncio
import requests.exceptions
import time
from typing import Optional
from urllib.parse import urlparse

import openai
from langchain_community.document_loaders import WebBaseLoader
from langchain_openai import OpenAIEmbeddings
from pinecone.exceptions import PineconeApiException
from supabase import create_client
from tenacity import (
    retry,
    retry_if_exception,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.config import (
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
    SUPABASE_SECRET_KEY,
    SUPABASE_URL,
)
from app.db.vector_store import get_index
from app.observability import log_ingest, timed
from app.services.rag_service import (
    MIN_TEXT_CHARS,
    chunk_text,
    chunk_vector_id,
    extract_pdf_multimodal,
)

UPSERT_BATCH_SIZE = 100


class EmptyDocumentError(Exception):
    pass


# ---------------------------------------------------------------------------
# Retry-wrapped external calls
# ---------------------------------------------------------------------------

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    reraise=True,
)
async def _fetch_url(url: str) -> str:
    loader = WebBaseLoader(url)
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, loader.load)
    return "\n\n".join(doc.page_content for doc in docs)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    reraise=True,
)
async def _download_storage(storage, path: str) -> bytes:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, lambda: storage.from_("documents").download(path)
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type((
        openai.RateLimitError,
        openai.APITimeoutError,
        openai.APIConnectionError,
        openai.InternalServerError,
    )),
    reraise=True,
)
async def _embed(embeddings_client: OpenAIEmbeddings, texts: list[str]) -> list[list[float]]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, embeddings_client.embed_documents, texts)


def _pinecone_retryable(exc: Exception) -> bool:
    if isinstance(exc, PineconeApiException):
        return getattr(exc, "status", 500) >= 500
    return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception(_pinecone_retryable),
    reraise=True,
)
async def _upsert(index, vectors: list[dict], namespace: str) -> None:
    loop = asyncio.get_event_loop()
    kwargs = {"vectors": vectors}
    if namespace:
        kwargs["namespace"] = namespace
    await loop.run_in_executor(None, lambda: index.upsert(**kwargs))


# ---------------------------------------------------------------------------
# Status helper
# ---------------------------------------------------------------------------

def _set_status(db, job_id: str, **fields) -> None:
    db.table("ingest_jobs").update(fields).eq("job_id", job_id).execute()


# ---------------------------------------------------------------------------
# Arq job
# ---------------------------------------------------------------------------

async def ingest_document(
    _ctx,
    *,
    job_id: str,
    user_id: str,
    collection_id: str,
    document_id: Optional[str],
    source_type: str,
    source: str,
    storage_path: Optional[str] = None,
    url: Optional[str] = None,
) -> None:
    db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    _set_status(db, job_id, status="processing")

    t_total = time.monotonic()
    load_ms = 0
    total_embed_ms = 0
    total_upsert_ms = 0

    try:
        # --- Load -----------------------------------------------------------
        if source_type == "pdf":
            with timed() as load_t:
                try:
                    pdf_bytes = await _download_storage(db.storage, storage_path)
                except Exception as exc:
                    _set_status(db, job_id, status="failed",
                                error_message=f"Could not download PDF from storage: {exc}")
                    log_ingest({
                        "event": "rag.ingest.complete",
                        "job_id": job_id,
                        "collection_id": collection_id,
                        "source": source,
                        "load_latency_ms": load_t["ms"],
                        "chunk_count": 0,
                        "embedding_latency_ms": 0,
                        "upsert_latency_ms": 0,
                        "total_latency_ms": int((time.monotonic() - t_total) * 1000),
                        "success": False,
                        "error": f"Could not download PDF from storage: {exc}",
                    })
                    return
                # Multimodal extraction: text chunks + image description chunks.
                # Scanned PDFs fall back to page-level vision automatically.
                chunks = await extract_pdf_multimodal(pdf_bytes, db.storage, job_id)
            load_ms = load_t["ms"]

            if not chunks:
                raise EmptyDocumentError(
                    "PDF contains no extractable content — "
                    "text extraction and vision analysis both yielded nothing."
                )
        else:
            with timed() as load_t:
                try:
                    text = await _fetch_url(url)
                except Exception as exc:
                    _set_status(db, job_id, status="failed",
                                error_message=f"Could not fetch URL after 3 attempts: {exc}")
                    log_ingest({
                        "event": "rag.ingest.complete",
                        "job_id": job_id,
                        "collection_id": collection_id,
                        "source": source,
                        "load_latency_ms": load_t["ms"],
                        "chunk_count": 0,
                        "embedding_latency_ms": 0,
                        "upsert_latency_ms": 0,
                        "total_latency_ms": int((time.monotonic() - t_total) * 1000),
                        "success": False,
                        "error": f"Could not fetch URL after 3 attempts: {exc}",
                    })
                    return
            load_ms = load_t["ms"]

            if len(text.strip()) < MIN_TEXT_CHARS:
                raise EmptyDocumentError(
                    f"No extractable text found at {url}. "
                    "The page may require JavaScript or be behind a login wall."
                )
            chunks = [{"text": c, "chunk_type": "text", "image_url": None}
                      for c in chunk_text(text)]

        # --- Chunk count ----------------------------------------------------
        total = len(chunks)
        _set_status(db, job_id, chunks_total=total)

        # --- Embed + upsert in batches -------------------------------------
        embeddings_client = OpenAIEmbeddings(
            model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSIONS
        )
        index = get_index()

        batch_errors: list[str] = []
        processed = 0
        successful_chunk_rows: list[dict] = []

        for batch_start in range(0, total, UPSERT_BATCH_SIZE):
            batch = chunks[batch_start: batch_start + UPSERT_BATCH_SIZE]
            batch_texts = [c["text"] for c in batch]

            with timed() as embed_t:
                try:
                    embeddings = await _embed(embeddings_client, batch_texts)
                except Exception as exc:
                    batch_errors.append(
                        f"chunks {batch_start}–{batch_start + len(batch) - 1}: "
                        f"embedding failed: {str(exc)[:200]}"
                    )
                    continue
            total_embed_ms += embed_t["ms"]

            vectors: list[dict] = []
            batch_chunk_rows: list[dict] = []
            for i, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                idx = batch_start + i
                cid = chunk_vector_id(collection_id, source, idx)
                vectors.append({
                    "id": cid,
                    "values": embedding,
                    "metadata": {
                        "text": chunk["text"],
                        "source": source,
                        "chunk_index": idx,
                        "chunk_type": chunk.get("chunk_type", "text"),
                        # Pinecone metadata values must be strings; use "" instead of None
                        "image_url": chunk.get("image_url") or "",
                    },
                })
                if document_id:
                    batch_chunk_rows.append({
                        "document_id": document_id,
                        "collection_id": collection_id or None,
                        "chunk_id": cid,
                        "chunk_index": idx,
                        "source": source,
                    })

            with timed() as upsert_t:
                try:
                    await _upsert(index, vectors, collection_id)
                except Exception as exc:
                    batch_errors.append(
                        f"chunks {batch_start}–{batch_start + len(batch) - 1}: "
                        f"Pinecone upsert failed: {str(exc)[:200]}"
                    )
                    continue
            total_upsert_ms += upsert_t["ms"]

            processed += len(batch)
            successful_chunk_rows.extend(batch_chunk_rows)
            _set_status(db, job_id, chunks_processed=processed)

        # --- Persist chunk→vector mapping ----------------------------------
        if successful_chunk_rows:
            db.table("document_chunks").insert(successful_chunk_rows).execute()

        # --- Update document chunk count -----------------------------------
        if document_id and not batch_errors:
            db.table("collection_documents").update(
                {"chunk_count": total}
            ).eq("id", document_id).execute()
        elif document_id and processed > 0:
            db.table("collection_documents").update(
                {"chunk_count": processed}
            ).eq("id", document_id).execute()

        # --- Final status --------------------------------------------------
        if not batch_errors:
            _set_status(db, job_id, status="succeeded", chunks_processed=total)
            log_ingest({
                "event": "rag.ingest.complete",
                "job_id": job_id,
                "collection_id": collection_id,
                "source": source,
                "load_latency_ms": load_ms,
                "chunk_count": total,
                "embedding_latency_ms": total_embed_ms,
                "upsert_latency_ms": total_upsert_ms,
                "total_latency_ms": int((time.monotonic() - t_total) * 1000),
                "success": True,
            })
        elif processed == 0:
            error_msg = "; ".join(batch_errors)
            _set_status(
                db, job_id, status="failed",
                error_message=error_msg,
            )
            log_ingest({
                "event": "rag.ingest.complete",
                "job_id": job_id,
                "collection_id": collection_id,
                "source": source,
                "load_latency_ms": load_ms,
                "chunk_count": total,
                "embedding_latency_ms": total_embed_ms,
                "upsert_latency_ms": total_upsert_ms,
                "total_latency_ms": int((time.monotonic() - t_total) * 1000),
                "success": False,
                "error": error_msg,
            })
        else:
            error_msg = (
                f"Partial success ({processed}/{total} chunks ingested). "
                + "; ".join(batch_errors)
            )
            _set_status(
                db, job_id, status="partial",
                error_message=error_msg,
            )
            log_ingest({
                "event": "rag.ingest.complete",
                "job_id": job_id,
                "collection_id": collection_id,
                "source": source,
                "load_latency_ms": load_ms,
                "chunk_count": total,
                "embedding_latency_ms": total_embed_ms,
                "upsert_latency_ms": total_upsert_ms,
                "total_latency_ms": int((time.monotonic() - t_total) * 1000),
                "success": False,
                "error": error_msg,
            })

    except EmptyDocumentError as exc:
        _set_status(db, job_id, status="failed", error_message=str(exc))
        log_ingest({
            "event": "rag.ingest.complete",
            "job_id": job_id,
            "collection_id": collection_id,
            "source": source,
            "load_latency_ms": load_ms,
            "chunk_count": 0,
            "embedding_latency_ms": 0,
            "upsert_latency_ms": 0,
            "total_latency_ms": int((time.monotonic() - t_total) * 1000),
            "success": False,
            "error": str(exc),
        })

    except Exception as exc:
        _set_status(
            db, job_id, status="failed",
            error_message=f"{type(exc).__name__}: {str(exc)[:500]}",
        )
        log_ingest({
            "event": "rag.ingest.complete",
            "job_id": job_id,
            "collection_id": collection_id,
            "source": source,
            "load_latency_ms": load_ms,
            "chunk_count": 0,
            "embedding_latency_ms": total_embed_ms,
            "upsert_latency_ms": total_upsert_ms,
            "total_latency_ms": int((time.monotonic() - t_total) * 1000),
            "success": False,
            "error": f"{type(exc).__name__}: {str(exc)[:500]}",
        })
        raise
