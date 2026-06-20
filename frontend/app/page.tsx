import UploadZone from "./components/UploadZone";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-0">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 px-5 h-11 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-amber-500" />
          <span className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-zinc-100">
            CRTX
          </span>
        </div>
        <span className="text-zinc-800 font-mono">│</span>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]">
          Document Intelligence
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-zinc-600">ready</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — ingest panel */}
        <aside className="w-72 shrink-0 border-r border-zinc-800 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]">
              Documents
            </p>
          </div>
          <div className="p-4">
            <UploadZone />
          </div>
        </aside>

        {/* Main — chat */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}
