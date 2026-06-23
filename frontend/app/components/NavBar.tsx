"use client";

import Link from "next/link";
import { useCollections } from "../context/collections";
import { useAuth } from "../context/auth";
import { useTab } from "../context/tab";

export default function NavBar() {
  const { collections, activeId, setActiveId } = useCollections();
  const { user, signOut } = useAuth();
  const { tab, setTab } = useTab();
  const isAdmin = user?.app_metadata?.is_admin === true;

  return (
    <header className="shrink-0 border-b border-zinc-800 px-4 sm:px-5 h-11 flex items-center gap-3 sm:gap-4 bg-zinc-950">
      <Link href="/" className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden>
          <line x1="14" y1="11" x2="14" y2="2" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="6" y2="7" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="4" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="8" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="14" y2="26" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="21" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="25" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="11" x2="21" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="14" y1="2" x2="6" y2="7" stroke="#38bdf8" strokeWidth="0.7" />
          <line x1="21" y1="5" x2="25" y2="14" stroke="#38bdf8" strokeWidth="0.7" />
          <circle cx="14" cy="11" r="2.2" fill="#38bdf8" />
          <circle cx="14" cy="2" r="1.6" fill="#38bdf8" />
          <circle cx="6" cy="7" r="1.6" fill="#38bdf8" />
          <circle cx="4" cy="14" r="1.6" fill="#38bdf8" />
          <circle cx="8" cy="21" r="1.6" fill="#38bdf8" />
          <circle cx="14" cy="26" r="1.6" fill="#38bdf8" />
          <circle cx="21" cy="21" r="1.6" fill="#38bdf8" />
          <circle cx="25" cy="14" r="1.6" fill="#38bdf8" />
          <circle cx="21" cy="5" r="1.6" fill="#38bdf8" />
        </svg>
        <span className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-zinc-100">
          CRTX
        </span>
      </Link>

      <span className="text-zinc-800 font-mono hidden sm:block">│</span>

      {user && (
        <div className="flex items-center gap-2">
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono px-2 py-1 outline-none focus:border-sky-400/70 max-w-[160px] cursor-pointer"
          >
            <option value="">— no collection —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Link
            href="/collections"
            className="text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-[0.1em]"
          >
            Manage
          </Link>
        </div>
      )}

      {isAdmin && activeId && (
        <button
          onClick={() => setTab(tab === "eval" ? "chat" : "eval")}
          className={[
            "hidden md:flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.1em] transition-colors",
            tab === "eval"
              ? "text-sky-400"
              : "text-zinc-500 hover:text-zinc-300",
          ].join(" ")}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
          Evals
        </button>
      )}

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            <span className="text-xs font-mono text-zinc-600 hidden sm:block truncate max-w-[140px]">
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-[0.1em]"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-100 uppercase tracking-[0.12em] transition-colors"
          >
            Sign in →
          </Link>
        )}
      </div>
    </header>
  );
}
