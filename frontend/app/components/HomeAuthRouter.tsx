"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "../context/collections";
import { useAuth } from "../context/auth";
import { useTab } from "../context/tab";
import UploadZone from "./UploadZone";
import ChatInterface from "./ChatInterface";
import PipelineConfig from "./PipelineConfig";
import DocumentList from "./DocumentList";
import EvalDashboard from "./EvalDashboard";

export default function HomeAuthRouter({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{children}</>;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { tab, setTab } = useTab();
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { activeId, pipelineConfig, savePipelineConfig, configSaving, collections } =
    useCollections();
  const activeCollection = collections.find((c) => c.id === activeId);
  const canIngest =
    !activeCollection ||
    !activeCollection.shared ||
    activeCollection.permission === "ingest";
  const isAdmin = user?.app_metadata?.is_admin === true;

  const tabs = [
    { id: "chat" as const, label: "Chat" },
    { id: "docs" as const, label: "Documents" },
    ...(isAdmin && activeId ? [{ id: "eval" as const, label: "Evals" }] : []),
  ];

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-0">
      {/* Mobile tab bar */}
      <div className="md:hidden shrink-0 flex border-b border-zinc-800 bg-zinc-950">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "relative flex-1 py-3 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-100",
              tab === t.id ? "text-sky-400" : "text-zinc-600 hover:text-zinc-400",
            ].join(" ")}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 inset-x-0 h-px bg-sky-400" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={[
            "border-zinc-800 flex flex-col overflow-y-auto bg-zinc-950",
            tab === "docs" ? "flex" : "hidden",
            "w-full",
            "md:flex md:w-72 md:shrink-0 md:border-r",
          ].join(" ")}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center gap-2.5">
            <div className="w-px h-4 bg-sky-400 shrink-0" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
              Documents
            </p>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {!activeId ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-px h-6 bg-zinc-800" />
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em] text-center leading-relaxed">
                  Select a collection
                  <br />
                  to manage documents
                </p>
              </div>
            ) : canIngest ? (
              <UploadZone
                onIngested={() => {
                  setRefreshKey((k) => k + 1);
                  setTab("chat");
                }}
                collectionId={activeId}
              />
            ) : (
              <div className="border border-zinc-800 px-3 py-2.5">
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
                  Query only — upload disabled
                </p>
              </div>
            )}
            {activeId && (
              <DocumentList collectionId={activeId} refreshKey={refreshKey} />
            )}
          </div>

          {isAdmin && (
            <PipelineConfig
              config={pipelineConfig}
              saving={configSaving}
              onChange={savePipelineConfig}
            />
          )}
        </aside>

        {/* Main — chat */}
        <main
          className={[
            "flex flex-col min-w-0 min-h-0 flex-1",
            tab === "chat" ? "flex" : "hidden",
            "md:flex",
          ].join(" ")}
        >
          {!activeId ? (
            <NoCollectionPlaceholder />
          ) : (
            <ChatInterface collectionId={activeId} />
          )}
        </main>

        {/* Main — eval dashboard */}
        {isAdmin && activeId && (
          <main
            className={[
              "flex flex-col min-w-0 min-h-0 flex-1",
              tab === "eval" ? "flex" : "hidden",
            ].join(" ")}
          >
            <EvalDashboard collectionId={activeId} />
          </main>
        )}
      </div>
    </div>
  );
}

function NoCollectionPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-zinc-950">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #3f3f46 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.12,
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.05), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* CRTX logo mark */}
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden>
          {[
            [14, 11, 14, 2],
            [14, 11, 6, 7],
            [14, 11, 4, 14],
            [14, 11, 8, 21],
            [14, 11, 14, 26],
            [14, 11, 21, 21],
            [14, 11, 25, 14],
            [14, 11, 21, 5],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#38bdf8" strokeWidth="1.5" opacity="0.35"
            />
          ))}
          {[
            [14, 11, 2.2],
            [14, 2, 1.6],
            [6, 7, 1.6],
            [4, 14, 1.6],
            [8, 21, 1.6],
            [14, 26, 1.6],
            [21, 21, 1.6],
            [25, 14, 1.6],
            [21, 5, 1.6],
          ].map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="#38bdf8" opacity={i === 0 ? "0.5" : "0.25"}
            />
          ))}
        </svg>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-mono font-semibold text-zinc-400">
            No collection selected
          </p>
          <p className="text-xs text-zinc-600 max-w-[200px] leading-relaxed">
            Choose a collection from the nav to start querying your documents.
          </p>
        </div>

        <Link
          href="/collections"
          className="px-5 py-2.5 border border-zinc-800 text-zinc-500 text-xs font-mono uppercase tracking-[0.15em] hover:border-zinc-600 hover:text-zinc-300 transition-colors"
        >
          Manage collections →
        </Link>
      </div>
    </div>
  );
}
