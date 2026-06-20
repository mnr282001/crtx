const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function ingestPdf(file: File) {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${BASE_URL}/ingest/`, { method: "POST", body });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function queryQuestion(question: string) {
  const res = await fetch(`${BASE_URL}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
