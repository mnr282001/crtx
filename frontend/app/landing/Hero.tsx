import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex items-center min-h-[calc(100vh-44px)] overflow-hidden bg-zinc-950 px-6">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #3f3f46 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />

      {/* Cyan ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          left: "55%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Scan line animation */}
      <div
        className="absolute inset-x-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(56,189,248,0.025), transparent)",
          animation: "scanDown 8s linear infinite",
          top: 0,
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto py-20 flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        {/* ── Left column ── */}
        <div className="flex-1 flex flex-col gap-8 lg:gap-10">
          {/* Label */}
          <div
            className="flex items-center gap-2.5"
            style={{ animation: "fadeUp 0.45s ease both 0.05s", opacity: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none" aria-hidden>
              <line x1="14" y1="11" x2="14" y2="2" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="6" y2="7" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="4" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="8" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="14" y2="26" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="21" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="25" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="11" x2="21" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="14" y1="2" x2="6" y2="7" stroke="#38bdf8" strokeWidth="0.7" />
              <line x1="21" y1="5" x2="25" y2="14" stroke="#38bdf8" strokeWidth="0.7" />
              <circle cx="14" cy="11" r="2.2" fill="#38bdf8" />
              <circle cx="14" cy="2" r="1.6" fill="#38bdf8" />
              <circle cx="6" cy="7" r="1.6" fill="#38bdf8" />
              <circle cx="4" cy="14" r="1.6" fill="#38bdf8" />
              <circle cx="8" cy="21" r="1.6" fill="#38bdf8" />
              <circle cx="14" cy="26" r="1.6" fill="#38bdf8" />
              <circle cx="21" cy="21" r="1.6" fill="#38bdf8" />
              <circle cx="25" cy="14" r="1.6" fill="#38bdf8" />
              <circle cx="21" cy="5" r="1.6" fill="#38bdf8" />
            </svg>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">
              CRTX — Document Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-bold text-zinc-50 leading-[0.92] tracking-tight"
            style={{
              fontSize: "clamp(2.75rem, 6vw, 5rem)",
              animation: "fadeUp 0.5s ease both 0.15s",
              opacity: 0,
            }}
          >
            Ask anything.
            <br />
            <span className="text-sky-400">Get answers.</span>
            <br />
            <span className="text-zinc-500">From your docs.</span>
          </h1>

          {/* Description */}
          <p
            className="text-base sm:text-lg text-zinc-400 max-w-[440px] leading-relaxed"
            style={{ animation: "fadeUp 0.5s ease both 0.28s", opacity: 0 }}
          >
            CRTX turns document collections into on-demand knowledge. Upload
            PDFs or URLs, ask natural-language questions, get cited answers
            instantly, across your whole team.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-3"
            style={{ animation: "fadeUp 0.5s ease both 0.4s", opacity: 0 }}
          >
            <Link
              href="/login"
              className="px-7 py-3.5 bg-sky-400 text-zinc-950 text-sm font-mono font-bold uppercase tracking-[0.15em] hover:bg-sky-300 active:bg-sky-500 transition-colors"
            >
              Get Started →
            </Link>
            <Link
              href="/login"
              className="px-7 py-3.5 border border-zinc-700 text-zinc-300 text-sm font-mono uppercase tracking-[0.15em] hover:border-zinc-500 hover:text-zinc-100 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Capability pills */}
          <div
            className="flex flex-wrap gap-2 pt-2"
            style={{ animation: "fadeUp 0.5s ease both 0.5s", opacity: 0 }}
          >
            {["PDF & URL ingestion", "Semantic search", "Session history", "Team workspaces", "Cited sources"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono text-zinc-600 border border-zinc-800 px-2.5 py-1 uppercase tracking-[0.12em]"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

        {/* ── Right column: Terminal demo ── */}
        <div
          className="w-full max-w-[500px] lg:w-[480px] shrink-0"
          style={{ animation: "fadeUp 0.6s ease both 0.25s", opacity: 0 }}
        >
          <TerminalDemo />
        </div>
      </div>
    </section>
  );
}

function TerminalDemo() {
  return (
    <div className="bg-zinc-900 border border-zinc-700/80 shadow-[0_0_80px_rgba(56,189,248,0.06)] overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[11px] font-mono text-zinc-600">
            CRTX / workspace-01 / q3-analysis
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 text-sm font-mono">
        {/* System status */}
        <p
          className="text-[11px] text-zinc-600 tracking-wide"
          style={{ animation: "reveal 0.2s ease both 0.9s", opacity: 0 }}
        >
          ▶ 3 documents indexed · semantic search ready
        </p>

        {/* Divider */}
        <div
          className="border-t border-zinc-800"
          style={{ animation: "reveal 0.2s ease both 1.1s", opacity: 0 }}
        />

        {/* User turn */}
        <div
          className="flex flex-col gap-1.5"
          style={{ animation: "reveal 0.3s ease both 1.3s", opacity: 0 }}
        >
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.22em]">
            User
          </span>
          <p className="text-zinc-300 leading-relaxed text-[13px]">
            What are the key findings from the Q3 report?
          </p>
        </div>

        {/* Divider */}
        <div
          className="border-t border-zinc-800"
          style={{ animation: "reveal 0.2s ease both 1.7s", opacity: 0 }}
        />

        {/* CRTX turn */}
        <div
          className="flex flex-col gap-3"
          style={{ animation: "reveal 0.3s ease both 2.0s", opacity: 0 }}
        >
          <span className="text-[10px] font-mono text-sky-400 uppercase tracking-[0.22em]">
            CRTX
          </span>
          <div className="border-l-2 border-sky-400/40 pl-3.5 flex flex-col gap-2">
            <p className="text-zinc-300 text-[13px] leading-relaxed">
              Based on the Q3 Strategic Review, the executive findings are:
            </p>
            <ul className="flex flex-col gap-1 text-zinc-500 text-[13px]">
              <li>— Revenue grew 23% YoY to $4.2M</li>
              <li>— Customer churn reduced to 3.2%</li>
              <li>— Three markets flagged for Q4 expansion</li>
            </ul>
          </div>
        </div>

        {/* Sources */}
        <div
          className="flex flex-col gap-2"
          style={{ animation: "reveal 0.3s ease both 2.4s", opacity: 0 }}
        >
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
            Sources · 2
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["Q3_report.pdf · p.4", "exec_summary.pdf · p.1"].map((s) => (
              <span
                key={s}
                className="text-[11px] font-mono text-zinc-600 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Cursor */}
        <div
          className="flex items-center gap-1.5 mt-1"
          style={{ animation: "reveal 0.2s ease both 2.7s", opacity: 0 }}
        >
          <span className="text-zinc-700">›</span>
          <span
            className="inline-block w-1.5 h-[15px] bg-sky-400"
            style={{ animation: "blink 1s step-end infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
