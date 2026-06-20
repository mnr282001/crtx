const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function ingestPdf(file: File, collectionId = "") {
  const body = new FormData();
  body.append("file", file);
  const url = collectionId
    ? `${BASE_URL}/ingest/?collection_id=${encodeURIComponent(collectionId)}`
    : `${BASE_URL}/ingest/`;
  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryQuestion(question: string, collectionId = "") {
  const res = await fetch(`${BASE_URL}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, collection_id: collectionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listCollections() {
  const res = await fetch(`${BASE_URL}/collections/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCollection(name: string) {
  const res = await fetch(`${BASE_URL}/collections/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCollection(id: string) {
  const res = await fetch(`${BASE_URL}/collections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
