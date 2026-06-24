"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "../context/collections";
import { useAuth } from "../context/auth";
import {
  createCollection,
  deleteCollection,
  createShare,
  listShares,
  deleteShare,
  removeMember,
} from "../api";
import ConfirmModal from "../components/ConfirmModal";

type Share = {
  id: string;
  share_token: string;
  permission: "query" | "ingest";
  created_at: string;
};
type Member = {
  id: string;
  user_id: string;
  email?: string;
  permission: "query" | "ingest";
  joined_at: string;
};

function ShareModal({
  collectionId,
  collectionName,
  onClose,
}: {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}) {
  const [shares, setShares] = useState<Share[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [permission, setPermission] = useState<"query" | "ingest">("query");
  const [creating, setCreating] = useState(false);
  const [loadingShares, setLoadingShares] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmMemberId, setConfirmMemberId] = useState<string | null>(null);

  const load = async () => {
    setLoadingShares(true);
    try {
      const data = await listShares(collectionId);
      setShares(data.shares ?? []);
      setMembers(data.members ?? []);
    } finally {
      setLoadingShares(false);
    }
  };

  // Load on mount
  useState(() => {
    load();
  });

  const create = async () => {
    setCreating(true);
    try {
      await createShare(collectionId, permission);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (shareId: string) => {
    await deleteShare(collectionId, shareId);
    await load();
  };

  const remove = async (memberId: string) => {
    await removeMember(collectionId, memberId);
    await load();
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div
          className="w-full max-w-md bg-zinc-900 border border-zinc-700 overflow-hidden"
          style={{ boxShadow: "0 0 60px rgba(56,189,248,0.08)" }}
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
            <div
              className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.07), transparent 70%)",
              }}
            />
            <div className="relative flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-[0.3em]">
                  Share Collection
                </span>
                <p className="text-sm font-mono font-semibold text-zinc-100 truncate max-w-[280px]">
                  {collectionName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line
                    x1="1" y1="1" x2="13" y2="13"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  />
                  <line
                    x1="13" y1="1" x2="1" y2="13"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Generate link */}
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-3">
              Generate invite link
            </p>
            <div className="flex items-center gap-2">
              <select
                value={permission}
                onChange={(e) =>
                  setPermission(e.target.value as "query" | "ingest")
                }
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono px-2.5 py-2 outline-none focus:border-sky-400/70 flex-1 cursor-pointer"
              >
                <option value="query">Query only</option>
                <option value="ingest">Query + Add docs</option>
              </select>
              <button
                onClick={create}
                disabled={creating}
                className="px-4 py-2 bg-sky-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.12em] hover:bg-sky-300 active:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {creating ? "…" : "Create"}
              </button>
            </div>
          </div>

          {/* Share links */}
          <div className="px-5 py-4 max-h-52 overflow-y-auto flex flex-col gap-2">
            {loadingShares ? (
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
                Loading…
              </p>
            ) : shares.length === 0 ? (
              <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
                No active links
              </p>
            ) : (
              shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 bg-zinc-800/40 border border-zinc-800 px-3 py-2.5"
                >
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-[0.1em] shrink-0 border ${
                      s.permission === "ingest"
                        ? "bg-sky-400/10 text-sky-400 border-sky-400/20"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {s.permission}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 flex-1 truncate">
                    {s.share_token.slice(0, 14)}…
                  </span>
                  <button
                    onClick={() => copyLink(s.share_token, s.id)}
                    className="text-[10px] font-mono text-zinc-500 hover:text-sky-300 transition-colors shrink-0 uppercase tracking-[0.1em]"
                  >
                    {copiedId === s.id ? "Copied ✓" : "Copy"}
                  </button>
                  <button
                    onClick={() => revoke(s.id)}
                    className="text-[10px] font-mono text-zinc-700 hover:text-red-400 transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div className="px-5 pb-4 border-t border-zinc-800 pt-4 flex flex-col gap-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">
                Members · {members.length}
              </p>
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 bg-zinc-800/30 border border-zinc-800 px-3 py-2"
                >
                  <span className="text-xs font-mono text-zinc-400 flex-1 truncate">
                    {m.email ?? m.user_id.slice(0, 8) + "…"}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-[0.1em] ${
                      m.permission === "ingest" ? "text-sky-400" : "text-zinc-600"
                    }`}
                  >
                    {m.permission}
                  </span>
                  <button
                    onClick={() => setConfirmMemberId(m.id)}
                    className="text-[10px] font-mono text-zinc-700 hover:text-red-400 transition-colors uppercase tracking-[0.1em]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmMemberId && (
        <ConfirmModal
          message="Remove this member from the collection?"
          confirmLabel="Remove"
          onConfirm={async () => {
            const id = confirmMemberId;
            setConfirmMemberId(null);
            await remove(id);
          }}
          onCancel={() => setConfirmMemberId(null)}
        />
      )}
    </>
  );
}

export default function CollectionsPage() {
  const { collections, activeId, setActiveId, refresh } = useCollections();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [sharingCollection, setSharingCollection] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createCollection(name.trim());
      setName("");
      await refresh();
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    await deleteCollection(id);
    if (activeId === id) setActiveId("");
    await refresh();
  };

  const isOwner = (col: { user_id?: string }) => col.user_id === user?.id;

  return (
    <>
      {sharingCollection && (
        <ShareModal
          collectionId={sharingCollection.id}
          collectionName={sharingCollection.name}
          onClose={() => setSharingCollection(null)}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Delete this collection? All documents and chat history will be permanently removed."
          confirmLabel="Delete"
          onConfirm={async () => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            await remove(id);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <div className="relative flex flex-col flex-1 bg-zinc-950 text-zinc-100 overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #3f3f46 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.18,
          }}
        />

        {/* Ambient glow top-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-80px",
            right: "-80px",
            width: "480px",
            height: "480px",
            background:
              "radial-gradient(circle, rgba(56,189,248,0.07), transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col flex-1 px-5 sm:px-8 py-7 max-w-2xl w-full mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2.5 mb-10">
            <Link
              href="/"
              className="group flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-[0.15em]"
            >
              <svg
                width="11" height="11" viewBox="0 0 11 11" fill="none"
                className="group-hover:-translate-x-0.5 transition-transform"
              >
                <path
                  d="M7.5 1.5L3.5 5.5L7.5 9.5"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              Home
            </Link>
            <span className="text-zinc-800 font-mono text-sm">│</span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
              Collections
            </span>
          </div>

          {/* Page header */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-px h-4 bg-sky-400 shrink-0" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                CRTX — Workspaces
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                  Collections
                </h1>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                  Organize your documents into queryable workspaces.
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-700 shrink-0 tabular-nums">
                {collections.length}{" "}
                {collections.length === 1 ? "workspace" : "workspaces"}
              </span>
            </div>
          </div>

          {/* Create form */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-4 mb-5">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.22em] mb-3">
              New collection
            </p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="e.g. Q3 Analysis, Legal Docs…"
                maxLength={200}
                className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm font-mono px-3 py-2.5 outline-none focus:border-sky-400/70 placeholder:text-zinc-700 transition-colors"
              />
              <button
                onClick={create}
                disabled={creating || !name.trim()}
                className="px-5 bg-sky-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.15em] hover:bg-sky-300 active:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {creating ? "…" : "Create"}
              </button>
            </div>
          </div>

          {/* Collections list */}
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-zinc-800/60">
              <div className="grid grid-cols-5 gap-1.5 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-zinc-600" />
                ))}
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.2em]">
                  No collections yet
                </p>
                <p className="text-xs text-zinc-700">
                  Create your first workspace above
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {collections.map((col) => {
                const active = activeId === col.id;
                const owned = isOwner(col as { user_id?: string });
                return (
                  <div
                    key={col.id}
                    className={`group relative flex items-center gap-3 pl-0 pr-3 py-3.5 border transition-all duration-150 cursor-pointer overflow-hidden ${
                      active
                        ? "border-sky-400/25 bg-sky-400/[0.04]"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                    onClick={() => setActiveId(col.id)}
                    style={
                      active
                        ? { boxShadow: "inset 0 0 24px rgba(56,189,248,0.03)" }
                        : {}
                    }
                  >
                    {/* Left accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-150 ${
                        active
                          ? "bg-sky-400"
                          : "bg-transparent group-hover:bg-zinc-700"
                      }`}
                    />

                    {/* Icon */}
                    <div
                      className={`ml-4 w-8 h-8 border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                        active
                          ? "border-sky-400/30 bg-sky-400/10"
                          : "border-zinc-800 bg-zinc-900 group-hover:border-zinc-700"
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect
                          x="1" y="2.5" width="10" height="8" rx="0.5"
                          stroke={active ? "#38bdf8" : "#52525b"} strokeWidth="1"
                        />
                        <path
                          d="M1 5H11"
                          stroke={active ? "#38bdf8" : "#52525b"} strokeWidth="1"
                        />
                        <path
                          d="M3.5 1L3.5 2.5"
                          stroke={active ? "#38bdf8" : "#52525b"}
                          strokeWidth="1" strokeLinecap="round"
                        />
                        <path
                          d="M8.5 1L8.5 2.5"
                          stroke={active ? "#38bdf8" : "#52525b"}
                          strokeWidth="1" strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-sm font-mono font-medium truncate transition-colors duration-150 ${
                            active
                              ? "text-sky-300"
                              : "text-zinc-200 group-hover:text-zinc-100"
                          }`}
                        >
                          {col.name}
                        </span>
                        {(col as { shared?: boolean }).shared && (
                          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-600 border border-zinc-800 px-1.5 py-0.5 shrink-0">
                            shared
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-zinc-700 mt-0.5 tabular-nums">
                        {col.id.slice(0, 8)}…
                      </p>
                    </div>

                    {/* Active badge */}
                    {active && (
                      <span className="text-[9px] font-mono text-sky-400/70 uppercase tracking-[0.2em] hidden sm:block shrink-0 mr-1">
                        active
                      </span>
                    )}

                    {/* Actions — reveal on hover */}
                    <div
                      className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-100 ${
                        active
                          ? "opacity-50 group-hover:opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {owned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingCollection({ id: col.id, name: col.name });
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-sky-300 hover:bg-zinc-800 transition-colors uppercase tracking-[0.1em]"
                        >
                          Share
                        </button>
                      )}
                      {owned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(col.id);
                          }}
                          className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Delete"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <line
                              x1="1.5" y1="1.5" x2="8.5" y2="8.5"
                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                            />
                            <line
                              x1="8.5" y1="1.5" x2="1.5" y2="8.5"
                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {collections.length > 0 && (
            <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.15em]">
              Click to set active · Changes apply immediately
            </p>
          )}
        </div>
      </div>
    </>
  );
}
