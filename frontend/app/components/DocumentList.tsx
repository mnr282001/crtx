"use client";

import { useEffect, useState, useCallback } from "react";
import { listDocuments, deleteDocument } from "../api";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "../context/auth";

interface CollectionDocument {
  id: string;
  name: string;
  source_type: "pdf" | "url";
  open_url: string | null;
  chunk_count: number | null;
  uploaded_at: string;
}

interface DocumentListProps {
  collectionId: string;
  refreshKey?: number;
}

export default function DocumentList({ collectionId, refreshKey = 0 }: DocumentListProps) {
  const { loading: authLoading } = useAuth();
  const [docs, setDocs] = useState<CollectionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDoc, setConfirmDoc] = useState<CollectionDocument | null>(null);

  const load = useCallback(async () => {
    if (!collectionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listDocuments(collectionId);
      setDocs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (!authLoading) load();
  }, [load, refreshKey, authLoading]);

  const doDelete = async () => {
    if (!confirmDoc) return;
    const doc = confirmDoc;
    setConfirmDoc(null);
    try {
      await deleteDocument(collectionId, doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      // silently ignore
    }
  };

  if (!collectionId) return null;

  return (
    <>
      {confirmDoc && (
        <ConfirmModal
          message={`Remove "${confirmDoc.source_type === "pdf" ? confirmDoc.name : (() => { try { const u = new URL(confirmDoc.name); return u.hostname; } catch { return confirmDoc.name; } })()}" from this collection?`}
          confirmLabel="Remove"
          onConfirm={doDelete}
          onCancel={() => setConfirmDoc(null)}
        />
      )}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em] pb-1">
          Ingested
        </p>

        {loading && (
          <p className="text-xs font-mono text-zinc-600 animate-pulse">Loading…</p>
        )}

        {error && (
          <p className="text-xs font-mono text-red-400 truncate">{error}</p>
        )}

        {!loading && !error && docs.length === 0 && (
          <p className="text-xs font-mono text-zinc-700">No documents yet</p>
        )}

        {docs.map((doc) => (
          <DocRow key={doc.id} doc={doc} onRequestDelete={() => setConfirmDoc(doc)} />
        ))}
      </div>
    </>
  );
}

function DocRow({ doc, onRequestDelete }: { doc: CollectionDocument; onRequestDelete: () => void }) {
  const isPdf = doc.source_type === "pdf";
  const displayName = isPdf ? doc.name : (() => {
    try {
      const u = new URL(doc.name);
      return u.hostname + (u.pathname !== "/" ? u.pathname : "");
    } catch {
      return doc.name;
    }
  })();

  const icon = (
    <span className="shrink-0 text-zinc-600">
      {isPdf ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
    </span>
  );

  const cls =
    "group border border-zinc-800 bg-zinc-900 px-2.5 py-2 transition-colors duration-100 flex items-center gap-2 " +
    (doc.open_url ? "hover:border-zinc-700 hover:bg-zinc-800/60" : "opacity-60");

  const inner = (
    <>
      {icon}
      <span className="text-zinc-300 truncate flex-1 font-mono text-xs">{displayName}</span>
      {doc.chunk_count != null && (
        <span className="shrink-0 text-zinc-600 font-mono text-xs tabular-nums">{doc.chunk_count}c</span>
      )}
      {doc.open_url && (
        <span className="shrink-0 text-zinc-600">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </span>
      )}
    </>
  );

  return (
    <div className={cls}>
      {doc.open_url ? (
        <a href={doc.open_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">{inner}</div>
      )}
      <button
        onClick={onRequestDelete}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-600 hover:text-red-400 text-[10px] transition-all"
      >
        ×
      </button>
    </div>
  );
}
