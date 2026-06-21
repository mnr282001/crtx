import type { PipelineConfigValue } from "./components/PipelineConfig";
import { supabase } from "./lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function ingestPdf(file: File, collectionId = "") {
  const body = new FormData();
  body.append("file", file);
  const url = collectionId
    ? `${BASE_URL}/ingest/?collection_id=${encodeURIComponent(collectionId)}`
    : `${BASE_URL}/ingest/`;
  const res = await fetch(url, { method: "POST", body, headers: await authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ingestUrl(url: string, collectionId = "") {
  const res = await fetch(`${BASE_URL}/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ url, collection_id: collectionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryQuestion(
  question: string,
  collectionId = "",
  pipeline = "",
  sessionId = ""
) {
  const res = await fetch(`${BASE_URL}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ question, collection_id: collectionId, pipeline, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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

export async function deleteChatSession(collectionId: string, sessionId: string) {
  const res = await fetch(`${BASE_URL}/chat/${collectionId}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
