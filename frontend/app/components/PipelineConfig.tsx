"use client";

import { useState } from "react";

export type RetrievalStrategy = "similarity" | "mmr" | "threshold";

export interface PipelineConfigValue {
  chunk_size: number;
  retrieval_strategy: RetrievalStrategy;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfigValue = {
  chunk_size: 1000,
  retrieval_strategy: "similarity",
};

const STRATEGIES: { value: RetrievalStrategy; label: string; desc: string }[] = [
  { value: "similarity", label: "Similarity", desc: "Top-k cosine match" },
  { value: "mmr", label: "MMR", desc: "Max marginal relevance" },
  { value: "threshold", label: "Threshold", desc: "Score ≥ 0.7 filter" },
];

interface Props {
  config: PipelineConfigValue;
  saving?: boolean;
  onChange: (config: PipelineConfigValue) => void;
}

export default function PipelineConfig({ config, saving = false, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-[0.15em] hover:text-zinc-300 transition-colors"
      >
        <span>Pipeline Config</span>
        <span className="flex items-center gap-2">
          {saving && (
            <span className="text-sky-400/70 normal-case tracking-normal">saving…</span>
          )}
          <span
            className={`inline-block transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-5">
          {/* Chunk size slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
                Chunk Size
              </p>
              <span className="text-xs font-mono text-sky-400">{config.chunk_size}</span>
            </div>
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={config.chunk_size}
              onChange={(e) =>
                onChange({ ...config, chunk_size: Number(e.target.value) })
              }
              className="w-full h-1 appearance-none bg-zinc-700 accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-700 mt-1">
              <span>200</span>
              <span>2000</span>
            </div>
          </div>

          {/* Retrieval strategy */}
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em] mb-2">
              Retrieval Strategy
            </p>
            <div className="flex flex-col gap-1">
              {STRATEGIES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => onChange({ ...config, retrieval_strategy: value })}
                  className={[
                    "flex items-center justify-between px-3 py-2 text-xs border transition-colors duration-100",
                    config.retrieval_strategy === value
                      ? "border-sky-400/50 text-sky-300 bg-sky-400/5"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
                  ].join(" ")}
                >
                  <span className="font-mono uppercase tracking-[0.1em]">{label}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
