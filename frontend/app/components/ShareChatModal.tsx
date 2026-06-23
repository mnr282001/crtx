"use client";

import { useState, useEffect, useRef } from "react";
import { getCollectionMembers, shareChatSession } from "../api";

interface Member {
  user_id: string;
  email: string;
  role: "owner" | "member";
}

interface Session {
  id: string;
  title: string;
}

export default function ShareChatModal({
  collectionId,
  session,
  onClose,
}: {
  collectionId: string;
  session: Session;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCollectionMembers(collectionId)
      .then(setMembers)
      .catch(() => setError("Failed to load collection members."))
      .finally(() => setMembersLoading(false));
  }, [collectionId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = members.filter((m) =>
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectMember = (m: Member) => {
    setSelected(m);
    setSearch(m.email);
    setDropdownOpen(false);
    setError(null);
  };

  const handleShare = async () => {
    if (!selected) return;
    setSharing(true);
    setError(null);
    try {
      await shareChatSession(collectionId, session.id, selected.user_id);
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to share chat.";
      // Surface the backend message directly — it's already user-friendly
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.detail ?? msg);
      } catch {
        setError(msg);
      }
    } finally {
      setSharing(false);
    }
  };

  const showDropdown = dropdownOpen && !membersLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">Share Chat</p>
            <p className="text-sm font-mono text-zinc-100">{session.title || "Untitled"}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm font-mono ml-3 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
          <p className="text-xs font-mono text-zinc-500">
            Pick a member of this collection to send the full chat history to.
          </p>

          {/* Combobox */}
          <div className="relative">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
                setDropdownOpen(true);
                setError(null);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={membersLoading ? "Loading members…" : "Search by email…"}
              disabled={membersLoading}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono px-3 py-2 outline-none focus:border-sky-400/70 placeholder:text-zinc-600 transition-colors disabled:opacity-40"
            />

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 z-20 bg-zinc-800 border border-zinc-700 border-t-0 max-h-44 overflow-y-auto"
              >
                {filtered.length === 0 ? (
                  <div className="px-3 py-2.5">
                    <p className="text-xs font-mono text-zinc-500">
                      {members.length === 0
                        ? "No other members in this collection."
                        : "No members match your search."}
                    </p>
                  </div>
                ) : (
                  filtered.map((m) => (
                    <button
                      key={m.user_id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectMember(m)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-700 text-left transition-colors border-b border-zinc-900 last:border-0"
                    >
                      <span className="flex-1 text-xs font-mono text-zinc-200 truncate">{m.email}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 ${
                          m.role === "owner"
                            ? "bg-sky-400/20 text-sky-300"
                            : "bg-zinc-700 text-zinc-500"
                        }`}
                      >
                        {m.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected member confirmation */}
          {selected && (
            <div className="flex items-center gap-2 bg-zinc-800 border border-sky-400/30 px-3 py-2">
              <svg className="w-3 h-3 text-sky-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-mono text-sky-300 flex-1 truncate">{selected.email}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 ${
                  selected.role === "owner"
                    ? "bg-sky-400/20 text-sky-300"
                    : "bg-zinc-700 text-zinc-500"
                }`}
              >
                {selected.role}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-950/60 border border-red-700 px-3 py-2.5">
              <p className="text-xs font-mono text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-emerald-950/60 border border-emerald-700 px-3 py-2.5">
              <p className="text-xs font-mono text-emerald-400">Chat shared — they'll see it in their history.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2 justify-end border-t border-zinc-800 pt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-[0.12em] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selected || sharing || success}
            className="px-4 py-1.5 bg-sky-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.12em] hover:bg-sky-300 active:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {sharing ? "…" : success ? "Shared!" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
