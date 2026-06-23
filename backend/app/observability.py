import json
import logging
import time
from contextlib import contextmanager

from supabase import create_client

from app.config import SUPABASE_SECRET_KEY, SUPABASE_URL


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if isinstance(record.msg, dict):
            return json.dumps(record.msg)
        return json.dumps({"message": record.getMessage()})


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("crtx")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(_JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


logger = _build_logger()

_db = None


def _get_db():
    global _db
    if _db is None:
        _db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    return _db


@contextmanager
def timed():
    """Yields a mutable dict; sets 'ms' on exit (even if an exception propagates)."""
    result: dict = {}
    t0 = time.monotonic()
    try:
        yield result
    finally:
        result["ms"] = int((time.monotonic() - t0) * 1000)


def log_query(record: dict) -> None:
    """Emit query record to stdout and persist to query_logs."""
    logger.info(record)
    try:
        _get_db().table("query_logs").insert({
            "request_id":            record["request_id"],
            "collection_id":         record["collection_id"] or None,
            "user_id":               record["user_id"],
            "retrieval_strategy":    record["retrieval_strategy"],
            "top_k":                 record["top_k"],
            "embedding_latency_ms":  record["embedding_latency_ms"],
            "retrieval_latency_ms":  record["retrieval_latency_ms"],
            "generation_latency_ms": record["generation_latency_ms"],
            "total_latency_ms":      record["total_latency_ms"],
            "num_chunks_retrieved":  record["num_chunks_retrieved"],
            "retrieval_scores":      record["retrieval_scores"],
            "prompt_tokens":         record["prompt_tokens"],
            "completion_tokens":     record["completion_tokens"],
            "model":                 record["model"],
        }).execute()
    except Exception:
        pass


def log_ingest(record: dict) -> None:
    """Emit ingest record to stdout and persist to ingest_logs."""
    logger.info(record)
    try:
        _get_db().table("ingest_logs").insert({
            "job_id":               record["job_id"],
            "collection_id":        record["collection_id"] or None,
            "source":               record["source"],
            "load_latency_ms":      record["load_latency_ms"],
            "chunk_count":          record["chunk_count"],
            "embedding_latency_ms": record["embedding_latency_ms"],
            "upsert_latency_ms":    record["upsert_latency_ms"],
            "total_latency_ms":     record["total_latency_ms"],
            "success":              record["success"],
            "error":                record.get("error"),
        }).execute()
    except Exception:
        pass
