const FEATURES = [
  {
    id: "01",
    title: "Multi-document workspaces",
    desc: "Organize any number of documents into named collections. Query across all of them simultaneously or drill into a single source.",
  },
  {
    id: "02",
    title: "Semantic Q&A",
    desc: "Ask questions in plain English — no query syntax required. CRTX retrieves the most relevant passages and synthesizes a precise answer.",
  },
  {
    id: "03",
    title: "Team collaboration",
    desc: "Share collections with colleagues via invite links. Grant query-only or full ingest access per person.",
  },
  {
    id: "04",
    title: "Cited answers",
    desc: "Every response includes the exact source passages and page references it was drawn from. No hallucinations go unchecked.",
  },
] as const;

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="border-t border-zinc-800 py-24 px-6 bg-zinc-950">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-px h-5 bg-sky-400 shrink-0" aria-hidden="true" />
          <h2 id="features-heading" className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">
            Capabilities
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className="group bg-zinc-950 p-8 flex flex-col gap-8 hover:bg-zinc-900 transition-colors duration-200"
            >
              <span className="text-5xl font-mono font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">
                {f.id}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-mono font-semibold text-zinc-100 uppercase tracking-[0.12em]">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
