"use client";

import { useState } from "react";
import { useCollections } from "./context/collections";
import { useAuth } from "./context/auth";
import { useTab } from "./context/tab";
import UploadZone from "./components/UploadZone";
import ChatInterface from "./components/ChatInterface";
import PipelineConfig from "./components/PipelineConfig";
import DocumentList from "./components/DocumentList";
import EvalDashboard from "./components/EvalDashboard";
import LandingPage from "./landing/LandingPage";

export default function Home() {
  const { tab, setTab } = useTab();
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading } = useAuth();
  const { activeId, collections, pipelineConfig, savePipelineConfig, configSaving } = useCollections();
  const activeCollection = collections.find((c) => c.id === activeId);
  const canIngest = !activeCollection || !activeCollection.shared || activeCollection.permission === "ingest";
  const isAdmin = user?.app_metadata?.is_admin === true;

  // Blank while resolving auth to avoid layout flash
  if (loading) return <div className="flex-1 bg-zinc-950" />;

  // Show landing page for unauthenticated visitors
  if (!user) return <LandingPage />;

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-0">
      {/* Mobile tab bar — hidden on md+ */}
      <div className="md:hidden shrink-0 flex border-b border-zinc-800">
        <button
          onClick={() => setTab("chat")}
          className={[
            "flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-100",
            tab === "chat"
              ? "text-sky-400 border-b-2 border-sky-400 -mb-px"
              : "text-zinc-500 hover:text-zinc-300",
          ].join(" ")}
        >
          Chat
        </button>
        <button
          onClick={() => setTab("docs")}
          className={[
            "flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-100",
            tab === "docs"
              ? "text-sky-400 border-b-2 border-sky-400 -mb-px"
              : "text-zinc-500 hover:text-zinc-300",
          ].join(" ")}
        >
          Documents
        </button>
        {isAdmin && activeId && (
          <button
            onClick={() => setTab("eval")}
            className={[
              "flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-100",
              tab === "eval"
                ? "text-sky-400 border-b-2 border-sky-400 -mb-px"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            Evals
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={[
            "border-zinc-800 flex flex-col overflow-y-auto",
            tab === "docs" ? "flex" : "hidden",
            "w-full",
            "md:flex md:w-72 md:shrink-0 md:border-r",
          ].join(" ")}
        >
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]">
              Documents
            </p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {canIngest ? (
              <UploadZone
                onIngested={() => { setRefreshKey((k) => k + 1); setTab("chat"); }}
                collectionId={activeId}
              />
            ) : (
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.15em]">
                Query only — no upload access
              </p>
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
            "flex flex-col min-w-0 min-h-0",
            tab === "chat" ? "flex" : "hidden",
            "flex-1",
            "md:flex",
          ].join(" ")}
        >
          <ChatInterface
            collectionId={activeId}
          />
        </main>

        {/* Main — eval dashboard (admin + collection required) */}
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
