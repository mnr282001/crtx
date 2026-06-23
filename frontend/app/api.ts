import type { PipelineConfigValue } from "./components/PipelineConfig";
import { supabase } from "./lib/supabase";

const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL = _apiUrl.startsWith("http") ? _apiUrl : `https://${_apiUrl}`;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface IngestJob {
  id: string;
  job_id: string;
  user_id: string;
  collection_id: string | null;
  source: string;
  status: "queued" | "processing" | "succeeded" | "failed" | "partial";
  error_message: string | null;
  chunks_processed: number;
  chunks_total: number | null;
  created_at: string;
  updated_at: string;
}

export async function ingestPdf(file: File, collectionId = ""): Promise<{ job_id: string }> {
  const body = new FormData();
  body.append("file", file);
  const url = collectionId
    ? `${BASE_URL}/ingest/?collection_id=${encodeURIComponent(collectionId)}`
    : `${BASE_URL}/ingest/`;
  const res = await fetch(url, { method: "POST", body, headers: await authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ingestUrl(url: string, collectionId = ""): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE_URL}/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ url, collection_id: collectionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getIngestJob(jobId: string): Promise<IngestJob> {
  const res = await fetch(`${BASE_URL}/ingest/jobs/${jobId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface StreamSource {
  source: string;
  chunk_index: number;
  text: string;
  score: number;
}

export async function queryQuestionStream(
  question: string,
  collectionId: string,
  pipeline: string,
  sessionId: string,
  onMetadata: (data: { sources: StreamSource[]; embedding_latency_ms: number; retrieval_latency_ms: number }) => void,
  onToken: (token: string) => void,
  onDone: (data: { generation_latency_ms: number; time_to_first_token_ms: number }) => void,
  onError: (message: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ question, collection_id: collectionId, pipeline, session_id: sessionId }),
    signal,
  });
  if (!res.ok) throw new Error(await res.text());

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const block of events) {
      if (!block.trim()) continue;
      let eventType = "";
      let eventData = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        if (line.startsWith("data: ")) eventData = line.slice(6);
      }
      if (!eventData) continue;
      const payload = JSON.parse(eventData);
      if (eventType === "metadata") onMetadata(payload);
      else if (eventType === "token") onToken(payload.token);
      else if (eventType === "done") onDone(payload);
      else if (eventType === "error") onError(payload.message);
    }
  }
}

export async function listCollections() {
  const res = await fetch(`${BASE_URL}/collections/`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCollection(name: string) {
  const res = await fetch(`${BASE_URL}/collections/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCollection(id: string) {
  const res = await fetch(`${BASE_URL}/collections/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCollectionConfig(collectionId: string): Promise<PipelineConfigValue> {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/config`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCollectionConfig(
  collectionId: string,
  config: PipelineConfigValue
): Promise<PipelineConfigValue> {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createShare(collectionId: string, permission: "query" | "ingest") {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ permission }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listShares(collectionId: string) {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/shares`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteShare(collectionId: string, shareId: string) {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/shares/${shareId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeMember(collectionId: string, memberId: string) {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/members/${memberId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDocuments(collectionId: string) {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/documents`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteDocument(collectionId: string, documentId: string) {
  const res = await fetch(`${BASE_URL}/collections/${collectionId}/documents/${documentId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function joinViaShare(shareToken: string) {
  const res = await fetch(`${BASE_URL}/collections/join/${shareToken}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listChatSessions(collectionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createChatSession(collectionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSessionMessages(collectionId: string, sessionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions/${sessionId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function renameChatSession(collectionId: string, sessionId: string, title: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteChatSession(collectionId: string, sessionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCollectionMembers(collectionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/members`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function shareChatSession(collectionId: string, sessionId: string, targetUserId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions/${sessionId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface EvalTrendPoint {
  date: string;
  avg_faithfulness: number;
  avg_context_relevance: number;
  count: number;
}

export interface WorstQuery {
  id: string;
  question: string;
  faithfulness_score: number;
  context_relevance_score: number | null;
  total_latency_ms: number | null;
  engine: string | null;
  created_at: string;
}

export interface EvalStats {
  total_queries: number;
  scored_queries: number;
  avg_faithfulness: number;
  avg_context_relevance: number;
  avg_total_latency_ms: number;
  avg_retrieval_latency_ms: number;
  avg_generation_latency_ms: number;
  trend: EvalTrendPoint[];
  worst_queries: WorstQuery[];
}

export async function getEvalStats(collectionId: string): Promise<EvalStats> {
  const res = await fetch(`${BASE_URL}/evals/${collectionId}/stats`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listEvals(collectionId: string, limit = 50, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/evals/${collectionId}?limit=${limit}&offset=${offset}`,
    { headers: await authHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
