import json

from openai import OpenAI
from supabase import create_client

from app.config import OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY

_client = OpenAI(api_key=OPENAI_API_KEY)
_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

_FAITHFULNESS_PROMPT = """\
You are an evaluation assistant. Given a question, retrieved context chunks, and a generated answer, \
score the FAITHFULNESS of the answer on a scale of 0.0 to 1.0.

Faithfulness measures whether every claim in the answer is directly supported by the provided context. \
A score of 1.0 means the answer is fully grounded in the context. \
A score of 0.0 means the answer contains hallucinations not found in the context.

Question: {question}

Context Chunks:
{context}

Generated Answer: {answer}

Respond with ONLY valid JSON: {{"score": <float 0.0-1.0>}}"""

_RELEVANCE_PROMPT = """\
You are an evaluation assistant. Given a question and retrieved context chunks, \
score the CONTEXT RELEVANCE on a scale of 0.0 to 1.0.

Context relevance measures how useful the retrieved chunks are for answering the question. \
A score of 1.0 means all chunks are highly relevant. \
A score of 0.0 means none of the chunks help answer the question.

Question: {question}

Context Chunks:
{context}

Respond with ONLY valid JSON: {{"score": <float 0.0-1.0>}}"""


def score_and_log(
    *,
    collection_id: str,
    session_id: str,
    user_id: str,
    question: str,
    sources: list,
    answer: str,
    retrieval_ms: int,
    generation_ms: int,
    engine: str,
    retrieval_strategy: str,
    top_k: int,
) -> None:
    context = "\n\n---\n\n".join(
        f"[Chunk {i + 1}] {s.get('text', '')}" for i, s in enumerate(sources)
    )

    faithfulness: float | None = None
    context_relevance: float | None = None
    scorer_error: str | None = None

    try:
        r = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": _FAITHFULNESS_PROMPT.format(
                question=question, context=context, answer=answer,
            )}],
            response_format={"type": "json_object"},
            max_tokens=100,
        )
        faithfulness = float(json.loads(r.choices[0].message.content).get("score", 0))

        r = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": _RELEVANCE_PROMPT.format(
                question=question, context=context,
            )}],
            response_format={"type": "json_object"},
            max_tokens=100,
        )
        context_relevance = float(json.loads(r.choices[0].message.content).get("score", 0))
    except Exception as exc:
        scorer_error = str(exc)

    try:
        _db.table("rag_evals").insert({
            "collection_id": collection_id or None,
            "session_id": session_id or None,
            "user_id": user_id,
            "question": question,
            "retrieved_chunks": sources,
            "answer": answer,
            "faithfulness_score": faithfulness,
            "context_relevance_score": context_relevance,
            "retrieval_latency_ms": retrieval_ms,
            "generation_latency_ms": generation_ms,
            "total_latency_ms": retrieval_ms + generation_ms,
            "engine": engine,
            "retrieval_strategy": retrieval_strategy,
            "top_k": top_k,
            "scorer_error": scorer_error,
        }).execute()
    except Exception:
        pass
