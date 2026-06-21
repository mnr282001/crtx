import time
from typing import Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import numpy as np

from openai import OpenAIError
from pinecone.exceptions import PineconeApiException

from app.config import EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, TOP_K
from app.db.vector_store import get_index
from app.services.rag_service import raise_openai_http_error, raise_pinecone_http_error


_RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "Answer the user's question only using the provided context."),
    ("user", "Context:\n{context}\n\nQuestion: {question}"),
])


def _embed_query(question: str) -> list:
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSIONS)
    try:
        return embeddings.embed_query(question)
    except OpenAIError as e:
        raise_openai_http_error(e)


def _retrieve(question: str, namespace: str, retrieval_strategy: str, top_k: int) -> list:
    index = get_index()
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

    return matches


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


def ask_question_langchain(question: str, namespace: str = "", config: Optional[dict] = None) -> dict:
    config = config or {}
    retrieval_strategy = config.get("retrieval_strategy", "similarity")
    top_k = config.get("top_k", TOP_K)

    matches = _retrieve(question, namespace, retrieval_strategy, top_k)
    context = "\n\n".join(m["metadata"]["text"] for m in matches)

    llm = ChatOpenAI(model="gpt-4o-mini")
    chain = _RAG_PROMPT | llm | StrOutputParser()

    try:
        answer = chain.invoke({"context": context, "question": question})
    except OpenAIError as e:
        raise_openai_http_error(e)

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
    }
