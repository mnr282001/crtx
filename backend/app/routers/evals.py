from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def _can_access(collection_id: str, user_id: str) -> bool:
    own = _db.table("collections").select("id").eq("id", collection_id).eq("user_id", user_id).execute()
    if own.data:
        return True
    member = _db.table("collection_members").select("id").eq("collection_id", collection_id).eq("user_id", user_id).execute()
    return bool(member.data)


@router.get("/{collection_id}/stats")
def get_eval_stats(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_access(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    res = (
        _db.table("rag_evals")
        .select("*")
        .eq("collection_id", collection_id)
        .order("created_at", desc=False)
        .limit(500)
        .execute()
    )
    evals = res.data or []

    scored = [e for e in evals if e.get("faithfulness_score") is not None]

    def _avg(vals):
        return round(sum(vals) / len(vals), 4) if vals else 0.0

    avg_faithfulness = _avg([e["faithfulness_score"] for e in scored])
    avg_context_relevance = _avg([e["context_relevance_score"] for e in scored if e.get("context_relevance_score") is not None])
    avg_total_ms = int(_avg([e["total_latency_ms"] for e in evals if e.get("total_latency_ms")]))
    avg_retrieval_ms = int(_avg([e["retrieval_latency_ms"] for e in evals if e.get("retrieval_latency_ms")]))
    avg_generation_ms = int(_avg([e["generation_latency_ms"] for e in evals if e.get("generation_latency_ms")]))

    # Daily trend buckets
    by_day: dict = defaultdict(list)
    for e in scored:
        day = (e.get("created_at") or "")[:10]
        if day:
            by_day[day].append(e)

    trend = [
        {
            "date": day,
            "avg_faithfulness": _avg([e["faithfulness_score"] for e in entries]),
            "avg_context_relevance": _avg([
                e["context_relevance_score"] for e in entries
                if e.get("context_relevance_score") is not None
            ]),
            "count": len(entries),
        }
        for day, entries in sorted(by_day.items())
    ]

    # Worst 10 by faithfulness
    worst_queries = [
        {
            "id": e["id"],
            "question": e["question"],
            "faithfulness_score": e["faithfulness_score"],
            "context_relevance_score": e.get("context_relevance_score"),
            "total_latency_ms": e.get("total_latency_ms"),
            "engine": e.get("engine"),
            "created_at": e.get("created_at"),
        }
        for e in sorted(scored, key=lambda e: e["faithfulness_score"])[:10]
    ]

    return {
        "total_queries": len(evals),
        "scored_queries": len(scored),
        "avg_faithfulness": avg_faithfulness,
        "avg_context_relevance": avg_context_relevance,
        "avg_total_latency_ms": avg_total_ms,
        "avg_retrieval_latency_ms": avg_retrieval_ms,
        "avg_generation_latency_ms": avg_generation_ms,
        "trend": trend,
        "worst_queries": worst_queries,
    }


@router.get("/{collection_id}")
def list_evals(
    collection_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: dict = Depends(get_current_user),
):
    if not _can_access(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    res = (
        _db.table("rag_evals")
        .select("id,question,answer,faithfulness_score,context_relevance_score,total_latency_ms,retrieval_latency_ms,generation_latency_ms,engine,retrieval_strategy,top_k,scorer_error,created_at")
        .eq("collection_id", collection_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return res.data or []
