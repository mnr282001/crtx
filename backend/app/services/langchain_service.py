import asyncio
import json
import time
from typing import AsyncGenerator, Optional

from langchain_community.callbacks import get_openai_callback
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import numpy as np

from openai import OpenAIError
from pinecone.exceptions import PineconeApiException

from app.config import EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, TOP_K
from app.db.vector_store import get_index
from app.observability import log_query, logger, timed
from app.services.rag_service import raise_openai_http_error, raise_pinecone_http_error


_SYSTEM_PROMPT = (
    "You are a precise, knowledgeable assistant that answers questions grounded in provided document context.\n\n"
    "Guidelines:\n"
    "- Answer using only the information in the context. Do not invent facts or draw on outside knowledge.\n"
    "- If the context is sufficient, answer thoroughly with appropriate depth and detail.\n"
    "- If the context is only partially relevant, use what is available and clearly note what is missing.\n"
    "- If the question cannot be answered from the context at all, say so directly — do not guess.\n"
    "- Reference the specific parts of the context that support your answer when helpful.\n"
    "- Use clear structure (bullet points, numbered lists, headers) when it improves readability.\n"
    "- For follow-up questions, use the conversation history to understand what the user is building on."
)

_RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="history", optional=True),
    ("user", "Context:\n{context}\n\nQuestion: {question}"),
])

_MODEL = "gpt-4o"


def _build_history(history: list) -> list:
    msgs = []
    for msg in history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            msgs.append(AIMessage(content=content))
    return msgs


def _embed_query(question: str) -> list:
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSIONS)
    try:
        return embeddings.embed_query(question)
    except OpenAIError as e:
        raise_openai_http_error(e)


def _retrieve(question: str, namespace: str, retrieval_strategy: str, top_k: int) -> tuple:
    """Returns (matches, embedding_ms, pinecone_ms)."""
    index = get_index()

    with timed() as embed_t:
        q_vec = _embed_query(question)

    fetch_k = top_k * 3 if retrieval_strategy == "mmr" else top_k
    include_values = retrieval_strategy == "mmr"

    kwargs = {
        "vector": q_vec,
        "top_k": fetch_k,
        "include_metadata": True,
        "include_values": include_values,
    }
    if namespace:
        kwargs["namespace"] = namespace

    with timed() as pinecone_t:
        try:
            results = index.query(**kwargs)
        except PineconeApiException as e:
            raise_pinecone_http_error(e)

    matches = results["matches"]

    if retrieval_strategy == "threshold":
        matches = [m for m in matches if m["score"] >= 0.7][:top_k]
    elif retrieval_strategy == "mmr":
        matches = _apply_mmr(matches, q_vec, top_k)
    else:
        matches = matches[:top_k]

    return matches, embed_t["ms"], pinecone_t["ms"]


def _apply_mmr(matches: list, query_vec: list, top_k: int, lambda_mult: float = 0.5) -> list:
    if not matches:
        return []

    doc_vecs = [m.get("values") for m in matches]
    if not doc_vecs[0]:
        return matches[:top_k]

    q = np.array(query_vec)
    vecs = np.array(doc_vecs)

    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-8
    vecs_norm = vecs / norms

    selected = []  # type: list
    remaining = list(range(len(matches)))

    while len(selected) < top_k and remaining:
        if not selected:
            sim_scores = np.array([matches[i]["score"] for i in remaining])
            best_pos = int(np.argmax(sim_scores))
        else:
            sel_vecs = vecs_norm[selected]
            mmr_scores = []
            for i in remaining:
                sim_q = matches[i]["score"]
                sim_sel = float(np.max(vecs_norm[i] @ sel_vecs.T))
                mmr_scores.append(lambda_mult * sim_q - (1 - lambda_mult) * sim_sel)
            best_pos = int(np.argmax(mmr_scores))

        chosen = remaining[best_pos]
        selected.append(chosen)
        remaining.pop(best_pos)

    return [matches[i] for i in selected]


def ask_question_langchain(question: str, namespace: str = "", config: Optional[dict] = None, history: Optional[list] = None) -> dict:
    config = config or {}
    retrieval_strategy = config.get("retrieval_strategy", "similarity")
    top_k = config.get("top_k", TOP_K)
    request_id = config.get("request_id", "")
    user_id = config.get("user_id", "")
    collection_id = config.get("collection_id", "")

    t_total = time.monotonic()

    matches, embedding_ms, pinecone_ms = _retrieve(question, namespace, retrieval_strategy, top_k)

    context = "\n\n".join(m["metadata"]["text"] for m in matches)
    history_messages = _build_history(history or [])

    llm = ChatOpenAI(model=_MODEL)
    chain = _RAG_PROMPT | llm | StrOutputParser()

    with timed() as gen_t:
        with get_openai_callback() as cb:
            try:
                answer = chain.invoke({"context": context, "question": question, "history": history_messages})
            except OpenAIError as e:
                raise_openai_http_error(e)

    total_ms = int((time.monotonic() - t_total) * 1000)

    log_query({
        "event": "rag.query.complete",
        "request_id": request_id,
        "collection_id": collection_id,
        "user_id": user_id,
        "retrieval_strategy": retrieval_strategy,
        "top_k": top_k,
        "embedding_latency_ms": embedding_ms,
        "retrieval_latency_ms": pinecone_ms,
        "generation_latency_ms": gen_t["ms"],
        "total_latency_ms": total_ms,
        "num_chunks_retrieved": len(matches),
        "retrieval_scores": [round(m["score"], 4) for m in matches],
        "prompt_tokens": cb.prompt_tokens,
        "completion_tokens": cb.completion_tokens,
        "model": _MODEL,
    })

    return {
        "answer": answer,
        "sources": [
            {
                "source": m["metadata"].get("source"),
                "chunk_index": m["metadata"].get("chunk_index"),
                "text": m["metadata"]["text"],
                "score": m["score"],
            }
            for m in matches
        ],
        "_embedding_ms": embedding_ms,
        "_retrieval_ms": embedding_ms + pinecone_ms,
        "_generation_ms": gen_t["ms"],
    }


async def stream_answer_langchain(
    question: str,
    namespace: str = "",
    config: Optional[dict] = None,
    on_done: Optional[object] = None,
    history: Optional[list] = None,
) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings:
      event: metadata  — sources + retrieval timing (sent before first token)
      event: token     — one chunk per LLM output token
      event: done      — generation timing after last token
      event: error     — if OpenAI fails mid-stream

    Retrieval (embed + Pinecone) runs in a thread and is not streamed.
    on_done(result_dict) is called after the last yield with the full answer + timing.
    """
    config = config or {}
    retrieval_strategy = config.get("retrieval_strategy", "similarity")
    top_k = config.get("top_k", TOP_K)
    request_id = config.get("request_id", "")
    user_id = config.get("user_id", "")
    collection_id = config.get("collection_id", "")

    t_total = time.monotonic()

    # Blocking retrieval runs in a thread to keep the event loop free.
    matches, embedding_ms, pinecone_ms = await asyncio.to_thread(
        _retrieve, question, namespace, retrieval_strategy, top_k
    )

    context = "\n\n".join(m["metadata"]["text"] for m in matches)
    history_messages = _build_history(history or [])
    sources = [
        {
            "source": m["metadata"].get("source"),
            "chunk_index": m["metadata"].get("chunk_index"),
            "text": m["metadata"]["text"],
            "score": m["score"],
        }
        for m in matches
    ]

    # First event: send sources before any token arrives so the UI can render them immediately.
    yield (
        "event: metadata\n"
        f"data: {json.dumps({'sources': sources, 'embedding_latency_ms': embedding_ms, 'retrieval_latency_ms': pinecone_ms})}\n\n"
    )

    llm = ChatOpenAI(model=_MODEL, streaming=True)
    chain = _RAG_PROMPT | llm | StrOutputParser()

    t_gen_start = time.monotonic()
    t_first_token: Optional[float] = None
    answer_parts: list = []
    prompt_tokens = 0
    completion_tokens = 0

    try:
        with get_openai_callback() as cb:
            async for chunk in chain.astream({"context": context, "question": question, "history": history_messages}):
                if t_first_token is None:
                    t_first_token = time.monotonic()
                answer_parts.append(chunk)
                yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"
        prompt_tokens = cb.prompt_tokens
        completion_tokens = cb.completion_tokens
    except asyncio.CancelledError:
        logger.warning({
            "event": "rag.stream.client_disconnect",
            "request_id": request_id,
            "partial_chars": sum(len(p) for p in answer_parts),
        })
        raise
    except OpenAIError as e:
        logger.error({"event": "rag.stream.error", "request_id": request_id, "error": str(e)})
        yield f"event: error\ndata: {json.dumps({'message': 'Generation failed'})}\n\n"
        return

    full_answer = "".join(answer_parts)
    generation_ms = int((time.monotonic() - t_gen_start) * 1000)
    time_to_first_token_ms = int((t_first_token - t_gen_start) * 1000) if t_first_token else 0
    total_ms = int((time.monotonic() - t_total) * 1000)

    yield (
        "event: done\n"
        f"data: {json.dumps({'generation_latency_ms': generation_ms, 'time_to_first_token_ms': time_to_first_token_ms})}\n\n"
    )

    # Everything below runs after the last SSE event is consumed by StreamingResponse
    # but before the connection is fully closed — client already has all tokens.
    log_query({
        "event": "rag.query.complete",
        "request_id": request_id,
        "collection_id": collection_id,
        "user_id": user_id,
        "retrieval_strategy": retrieval_strategy,
        "top_k": top_k,
        "embedding_latency_ms": embedding_ms,
        "retrieval_latency_ms": pinecone_ms,
        "generation_latency_ms": generation_ms,
        "time_to_first_token_ms": time_to_first_token_ms,
        "total_latency_ms": total_ms,
        "num_chunks_retrieved": len(matches),
        "retrieval_scores": [round(m["score"], 4) for m in matches],
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "model": _MODEL,
    })

    if on_done is not None:
        on_done({
            "answer": full_answer,
            "sources": sources,
            "_embedding_ms": embedding_ms,
            "_retrieval_ms": embedding_ms + pinecone_ms,
            "_generation_ms": generation_ms,
        })
