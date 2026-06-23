"use client";

import { useState } from "react";

interface Source {
  source: string;
  chunk_index: number;
  text: string;
  score: number;
  chunk_type?: "text" | "image_description";
  image_url?: string | null;
}

export default function SourceCard({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(source.score * 100);

  const badge =
    source.score >= 0.8
      ? "text-emerald-400 border-emerald-500/50 bg-emerald-500/5"
      : source.score >= 0.6
      ? "text-sky-300 border-sky-400/50 bg-sky-400/5"
      : "text-red-400 border-red-500/50 bg-red-500/5";

  return (
    <div className="border border-zinc-800 bg-zinc-900/70 text-xs font-mono">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors duration-100 cursor-pointer"
      >
        {source.chunk_type === "image_description" ? (
          <span className="text-zinc-500 text-[10px] shrink-0 border border-zinc-700 px-1 py-px">
            IMG
          </span>
        ) : (
          <span className="text-zinc-600 shrink-0 w-6 text-right">
            #{source.chunk_index}
          </span>
        )}
        <span className="text-zinc-400 truncate flex-1">{source.source}</span>
        <span className={`border px-1.5 py-0.5 shrink-0 ${badge}`}>
          {pct}%
        </span>
        <span className="text-zinc-600 shrink-0 w-3">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-3 space-y-2">
          {source.chunk_type === "image_description" && source.image_url && (
            <img
              src={source.image_url}
              alt="Referenced figure"
              className="max-w-full rounded border border-zinc-700"
            />
          )}
          <p className="text-zinc-400 leading-6 whitespace-pre-wrap break-words">
            {source.text}
          </p>
        </div>
      )}
    </div>
  );
}
