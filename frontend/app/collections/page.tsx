"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "../context/collections";
import { useAuth } from "../context/auth";
import { createCollection, deleteCollection, createShare, listShares, deleteShare, removeMember } from "../api";
import ConfirmModal from "../components/ConfirmModal";

type Share = { id: string; share_token: string; permission: "query" | "ingest"; created_at: string };
type Member = { id: string; user_id: string; email?: string; permission: "query" | "ingest"; joined_at: string };

function ShareModal({ collectionId, collectionName, onClose }: { collectionId: string; collectionName: string; onClose: () => void }) {
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
  useState(() => { load(); });

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
    {confirmMemberId && (
      <ConfirmModal
        message="Remove this member from the collection?"
        confirmLabel="Remove"
        onConfirm={async () => { const id = confirmMemberId; setConfirmMemberId(null); await remove(id); }}
        onCancel={() => setConfirmMemberId(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-zinc-500">Share</p>
            <p className="text-sm font-mono text-zinc-100 truncate">{collectionName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm font-mono">✕</button>
        </div>

        {/* Create link */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "query" | "ingest")}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono px-2 py-1.5 outline-none focus:border-amber-500/70"
          >
            <option value="query">Query only</option>
            <option value="ingest">Query + Add docs</option>
          </select>
          <button
            onClick={create}
            disabled={creating}
            className="px-3 py-1.5 bg-amber-500 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.12em] hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "…" : "Create link"}
          </button>
        </div>

        {/* Share links */}
        <div className="px-4 py-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
          {loadingShares ? (
            <p className="text-xs font-mono text-zinc-600">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.12em]">No share links yet</p>
          ) : (
            shares.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-zinc-800 px-3 py-2">
                <span className={`text-xs font-mono px-1.5 py-0.5 ${s.permission === "ingest" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>
                  {s.permission === "ingest" ? "ingest" : "query"}
                </span>
                <span className="text-xs font-mono text-zinc-500 flex-1 truncate">{s.share_token.slice(0, 12)}…</span>
                <button
                  onClick={() => copyLink(s.share_token, s.id)}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                >
                  {copiedId === s.id ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => revoke(s.id)}
                  className="text-xs font-mono text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="px-4 pb-3 flex flex-col gap-1 border-t border-zinc-800 pt-3">
            <p className="text-xs font-mono uppercase tracking-[0.12em] text-zinc-600 mb-1">Members</p>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500 flex-1 truncate">{m.email ?? m.user_id.slice(0, 8) + "…"}</span>
                <span className={`text-xs font-mono px-1.5 py-0.5 ${m.permission === "ingest" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>
                  {m.permission}
                </span>
                <button
                  onClick={() => setConfirmMemberId(m.id)}
                  className="text-xs font-mono text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function CollectionsPage() {
  const { collections, activeId, setActiveId, refresh } = useCollections();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [sharingCollection, setSharingCollection] = useState<{ id: string; name: string } | null>(null);

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

      <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-lg w-full mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-[0.1em]"
            >
              ← Back
            </Link>
            <span className="text-zinc-800 font-mono">│</span>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]">
              Collections
            </span>
          </div>

          {/* Create form */}
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="New collection name…"
              className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-mono px-3 py-2 outline-none focus:border-amber-500/70 placeholder:text-zinc-600 transition-colors"
            />
            <button
              onClick={create}
              disabled={creating || !name.trim()}
              className="px-4 bg-amber-500 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.15em] hover:bg-amber-400 active:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "…" : "Create"}
            </button>
          </div>

          {/* List */}
          {collections.length === 0 ? (
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.15em]">
              No collections yet
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className={`flex items-center gap-3 px-3 py-2.5 border font-mono text-sm transition-colors ${
                    activeId === col.id
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <button
                    className={`flex-1 text-left truncate ${
                      activeId === col.id ? "text-amber-400" : "text-zinc-300"
                    }`}
                    onClick={() => setActiveId(col.id)}
                  >
                    {col.name}
                    {(col as { shared?: boolean }).shared && (
                      <span className="ml-2 text-xs text-zinc-600">(shared)</span>
                    )}
                  </button>
                  <span className="text-xs text-zinc-700 hidden sm:block shrink-0">
                    {col.id.slice(0, 8)}
                  </span>
                  {isOwner(col as { user_id?: string }) && (
                    <button
                      onClick={() => setSharingCollection({ id: col.id, name: col.name })}
                      className="text-zinc-600 hover:text-amber-400 transition-colors text-xs shrink-0 font-mono"
                      title="Share"
                    >
                      Share
                    </button>
                  )}
                  {isOwner(col as { user_id?: string }) && (
                    <button
                      onClick={() => remove(col.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xs shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
