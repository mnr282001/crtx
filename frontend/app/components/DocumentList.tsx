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

export default function DocumentList({
  collectionId,
  refreshKey = 0,
}: DocumentListProps) {
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

  const displayName = (doc: CollectionDocument) => {
    if (doc.source_type === "pdf") return doc.name;
    try {
      const u = new URL(doc.name);
      return u.hostname + (u.pathname !== "/" ? u.pathname : "");
    } catch {
      return doc.name;
    }
  };

  return (
    <>
      {confirmDoc && (
        <ConfirmModal
          message={`Remove "${displayName(confirmDoc)}" from this collection?`}
          confirmLabel="Remove"
          onConfirm={doDelete}
          onCancel={() => setConfirmDoc(null)}
        />
      )}

      <div className="flex flex-col gap-2">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.22em]">
            Ingested
          </span>
          {docs.length > 0 && !loading && (
            <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
              {docs.length}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex flex-col gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-9 bg-zinc-900 border border-zinc-800 animate-pulse"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-[11px] font-mono text-red-400/80 truncate">{error}</p>
        )}

        {!loading && !error && docs.length === 0 && (
          <p className="text-[11px] font-mono text-zinc-700">
            No documents yet
          </p>
        )}

        {!loading && docs.length > 0 && (
          <div className="flex flex-col gap-1">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                displayName={displayName(doc)}
                onRequestDelete={() => setConfirmDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DocRow({
  doc,
  displayName,
  onRequestDelete,
}: {
  doc: CollectionDocument;
  displayName: string;
  onRequestDelete: () => void;
}) {
  const isPdf = doc.source_type === "pdf";

  const content = (
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      {/* Type icon */}
      <div className="shrink-0 w-6 h-6 flex items-center justify-center border border-zinc-800 bg-zinc-900">
        {isPdf ? (
          <svg
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="#52525b" strokeWidth="1.5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ) : (
          <svg
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="#52525b" strokeWidth="1.5"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-mono text-zinc-300 truncate flex-1 leading-none">
        {displayName}
      </span>

      {/* Chunk badge */}
      {doc.chunk_count != null && (
        <span className="shrink-0 text-[9px] font-mono text-zinc-700 tabular-nums">
          {doc.chunk_count}c
        </span>
      )}

      {/* External link indicator */}
      {doc.open_url && (
        <svg
          width="9" height="9" viewBox="0 0 24 24"
          fill="none" stroke="#3f3f46" strokeWidth="2"
          className="shrink-0"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
    </div>
  );

  return (
    <div
      className={`group flex items-center gap-1.5 px-2.5 py-2 border border-zinc-800/80 bg-zinc-900/50 transition-colors duration-100 ${
        doc.open_url ? "hover:border-zinc-700 hover:bg-zinc-900" : "opacity-60"
      }`}
    >
      {doc.open_url ? (
        <a
          href={doc.open_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0"
        >
          {content}
        </a>
      ) : (
        <div className="flex-1 min-w-0">{content}</div>
      )}

      <button
        onClick={onRequestDelete}
        className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 flex items-center justify-center text-zinc-700 hover:text-red-400 transition-all duration-100"
        title="Remove"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
