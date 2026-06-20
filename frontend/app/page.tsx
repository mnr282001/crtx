"use client";

import { useState } from "react";
import { useCollections } from "./context/collections";
import UploadZone from "./components/UploadZone";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [tab, setTab] = useState<"docs" | "chat">("chat");
  const { activeId } = useCollections();

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-0">
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
          <div className="p-4">
            <UploadZone
              onIngested={() => setTab("chat")}
              collectionId={activeId}
            />
          </div>
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
          <ChatInterface collectionId={activeId} />
        </main>
      </div>
    </div>
  );
}
