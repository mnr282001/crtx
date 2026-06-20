"use client";

import { useState } from "react";
import UploadZone from "./components/UploadZone";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [tab, setTab] = useState<"docs" | "chat">("chat");

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-0">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 px-4 sm:px-5 h-11 flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-amber-500" />
          <span className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-zinc-100">
            CRTX
          </span>
        </div>
        <span className="text-zinc-800 font-mono hidden sm:block">│</span>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em] hidden sm:block">
          Document Intelligence
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-zinc-600">ready</span>
        </div>
      </header>

      {/* Mobile tab bar — hidden on md+ */}
      <div className="md:hidden shrink-0 flex border-b border-zinc-800">
        <button
          onClick={() => setTab("chat")}
          className={[
            "flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-100",
            tab === "chat"
              ? "text-amber-500 border-b-2 border-amber-500 -mb-px"
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
              ? "text-amber-500 border-b-2 border-amber-500 -mb-px"
              : "text-zinc-500 hover:text-zinc-300",
          ].join(" ")}
        >
          Documents
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — visible on md+, or when docs tab active on mobile */}
        <aside
          className={[
            "border-zinc-800 flex flex-col overflow-y-auto",
            // Mobile: full width, shown/hidden by tab
            tab === "docs" ? "flex" : "hidden",
            "w-full",
            // Desktop: fixed sidebar, always visible
            "md:flex md:w-72 md:shrink-0 md:border-r",
          ].join(" ")}
        >
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]">
              Documents
            </p>
          </div>
          <div className="p-4">
            <UploadZone onIngested={() => setTab("chat")} />
          </div>
        </aside>

        {/* Main — chat */}
        <main
          className={[
            "flex flex-col min-w-0 min-h-0",
            // Mobile: full width, shown/hidden by tab
            tab === "chat" ? "flex" : "hidden",
            "flex-1",
            // Desktop: always visible
            "md:flex",
          ].join(" ")}
        >
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}
