"use client";

import Link from "next/link";
import { useCollections } from "../context/collections";

export default function NavBar() {
  const { collections, activeId, setActiveId } = useCollections();

  return (
    <header className="shrink-0 border-b border-zinc-800 px-4 sm:px-5 h-11 flex items-center gap-3 sm:gap-4 bg-zinc-950">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-amber-500" />
        <span className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-zinc-100">
          CRTX
        </span>
      </Link>

      <span className="text-zinc-800 font-mono hidden sm:block">│</span>

      {/* Collection switcher */}
      <div className="flex items-center gap-2">
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono px-2 py-1 outline-none focus:border-amber-500/70 max-w-[160px] cursor-pointer"
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

      <div className="ml-auto flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono text-zinc-600">ready</span>
      </div>
    </header>
  );
}
