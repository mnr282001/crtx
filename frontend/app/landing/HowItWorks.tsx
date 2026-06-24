const STEPS = [
  {
    step: "01",
    title: "Upload",
    desc: "Add PDFs or paste URLs into any collection. CRTX chunks and embeds them into a semantic index in seconds.",
    tag: "PDF · URL · Multi-file",
  },
  {
    step: "02",
    title: "Ask",
    desc: "Type a question in plain English. No boolean operators, no query syntax — just what you want to know.",
    tag: "Natural language",
  },
  {
    step: "03",
    title: "Get Answers",
    desc: "Receive a synthesized answer with the exact source passages cited. Drill into any source to read the original.",
    tag: "Cited · Accurate",
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="border-t border-zinc-800 py-24 px-6 bg-zinc-900/40">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-px h-5 bg-sky-400 shrink-0" aria-hidden="true" />
          <h2 id="how-it-works-heading" className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">
            How it works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {/* Connecting line on md+ */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-zinc-800 z-0" />

          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className="relative z-10 flex flex-col gap-6 p-8 border-t border-zinc-800 md:border-t-0 md:border-l first:border-l-0"
            >
              {/* Number box */}
              <div className="w-16 h-16 border border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0">
                <span className="text-2xl font-mono font-bold text-sky-400">
                  {s.step}
                </span>
              </div>

              {/* Arrow connector — mobile only */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden absolute right-6 top-12 text-zinc-700 font-mono text-lg">
                  ↓
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-[260px]">
                  {s.desc}
                </p>
                <span className="text-[11px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
                  {s.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
