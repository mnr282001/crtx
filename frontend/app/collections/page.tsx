"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "../context/collections";
import { createCollection, deleteCollection } from "../api";

export default function CollectionsPage() {
  const { collections, activeId, setActiveId, refresh } = useCollections();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

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

  return (
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
                </button>
                <span className="text-xs text-zinc-700 hidden sm:block shrink-0">
                  {col.id.slice(0, 8)}
                </span>
                <button
                  onClick={() => remove(col.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
