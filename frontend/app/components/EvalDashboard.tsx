"use client";

import { useEffect, useState, useCallback } from "react";
import { getEvalStats, type EvalStats, type EvalTrendPoint } from "../api";

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreColor(v: number | null): string {
  if (v === null) return "text-zinc-500";
  if (v >= 0.8) return "text-emerald-400";
  if (v >= 0.5) return "text-sky-300";
  return "text-red-400";
}

function scoreBg(v: number | null): string {
  if (v === null) return "bg-zinc-700";
  if (v >= 0.8) return "bg-emerald-500";
  if (v >= 0.5) return "bg-sky-400";
  return "bg-red-500";
}

function fmt(v: number | null, digits = 2): string {
  return v === null ? "—" : v.toFixed(digits);
}

function fmtMs(ms: number | null): string {
  if (ms === null || ms === 0) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

// ── micro SVG line chart ──────────────────────────────────────────────────────

function TrendChart({ data }: { data: EvalTrendPoint[] }) {
  const W = 400;
  const H = 90;
  const PAD = 6;

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-zinc-600 font-mono">
        Not enough data yet
      </div>
    );
  }

  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2));
  const faithPoints = data.map((d) => d.avg_faithfulness);
  const relevPoints = data.map((d) => d.avg_context_relevance);

  function toY(v: number) {
    return PAD + (1 - v) * (H - PAD * 2);
  }

  function polyline(ys: number[]) {
    return xs.map((x, i) => `${x.toFixed(1)},${toY(ys[i]).toFixed(1)}`).join(" ");
  }

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines at 0.25 / 0.5 / 0.75 */}
        {[0.25, 0.5, 0.75].map((v) => (
          <line
            key={v}
            x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
            stroke="#27272a" strokeWidth="1"
          />
        ))}
        {/* Faithfulness */}
        <polyline
          points={polyline(faithPoints)}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Context relevance */}
        <polyline
          points={polyline(relevPoints)}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeDasharray="4 2"
        />
        {/* Dots for faithfulness */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={toY(faithPoints[i])} r="2" fill="#38bdf8" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-0.5">
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

// ── latency bar ───────────────────────────────────────────────────────────────

function LatencyBar({ label, ms, maxMs, color }: {
  label: string;
  ms: number;
  maxMs: number;
  color: string;
}) {
  const pct = maxMs > 0 ? (ms / maxMs) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-mono text-zinc-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-xs font-mono text-zinc-300 text-right shrink-0">{fmtMs(ms)}</span>
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.12em]">{label}</span>
      <span className="text-xl font-mono text-zinc-100">{value}</span>
      {sub && <span className="text-[10px] font-mono text-zinc-600">{sub}</span>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function EvalDashboard({ collectionId }: { collectionId: string }) {
  const [stats, setStats] = useState<EvalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getEvalStats(collectionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs font-mono text-zinc-600">
        Loading eval data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-xs font-mono text-red-400">{error}</p>
        <button
          onClick={load}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats || stats.total_queries === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs font-mono text-zinc-600">
        No queries yet — send a message to start collecting evals.
      </div>
    );
  }

  const maxLatency = Math.max(
    stats.avg_retrieval_latency_ms,
    stats.avg_generation_latency_ms,
    stats.avg_total_latency_ms,
  );

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-[0.15em]">
          Eval Dashboard
        </h2>
        <button
          onClick={load}
          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Total Queries"
          value={String(stats.total_queries)}
          sub={`${stats.scored_queries} scored`}
        />
        <StatCard
          label="Faithfulness"
          value={fmt(stats.avg_faithfulness)}
          sub="avg 0–1"
        />
        <StatCard
          label="Context Relevance"
          value={fmt(stats.avg_context_relevance)}
          sub="avg 0–1"
        />
        <StatCard
          label="Avg Latency"
          value={fmtMs(stats.avg_total_latency_ms)}
          sub="end-to-end"
        />
      </div>

      {/* Trend chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.12em]">Score Trends</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="inline-block w-4 h-0.5 bg-sky-400 rounded" />
              Faithfulness
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="inline-block w-4 border-b border-dashed border-indigo-400" />
              Relevance
            </span>
          </div>
        </div>
        <TrendChart data={stats.trend} />
      </div>

      {/* Latency breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.12em]">Latency Breakdown</span>
        <div className="flex flex-col gap-2.5">
          <LatencyBar label="Retrieval" ms={stats.avg_retrieval_latency_ms} maxMs={maxLatency} color="bg-indigo-500" />
          <LatencyBar label="Generation" ms={stats.avg_generation_latency_ms} maxMs={maxLatency} color="bg-sky-400" />
          <LatencyBar label="Total" ms={stats.avg_total_latency_ms} maxMs={maxLatency} color="bg-zinc-500" />
        </div>
      </div>

      {/* Worst queries */}
      {stats.worst_queries.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.12em]">
            Lowest Faithfulness Queries
          </span>
          <div className="flex flex-col divide-y divide-zinc-800">
            {stats.worst_queries.map((q) => (
              <div key={q.id} className="py-2.5 flex flex-col gap-1">
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{q.question}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-mono ${scoreColor(q.faithfulness_score)}`}>
                    faith {fmt(q.faithfulness_score)}
                  </span>
                  <span className={`text-[10px] font-mono ${scoreColor(q.context_relevance_score)}`}>
                    rel {fmt(q.context_relevance_score)}
                  </span>
                  {q.total_latency_ms !== null && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {fmtMs(q.total_latency_ms)}
                    </span>
                  )}
                  {q.engine && (
                    <span className="text-[10px] font-mono text-zinc-700">{q.engine}</span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-700 ml-auto">
                    {q.created_at?.slice(0, 10)}
                  </span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${scoreBg(q.faithfulness_score)} transition-all`}
                    style={{ width: `${(q.faithfulness_score ?? 0) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
