import Link from "next/link";

export default function ClosingCTA() {
  return (
    <>
      {/* CTA section */}
      <section className="border-t border-zinc-800 py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="relative border border-zinc-800 p-10 sm:p-14 lg:p-20 overflow-hidden">
            {/* Decorative cyan glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-60px",
                right: "-60px",
                width: "400px",
                height: "400px",
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)",
              }}
            />
            {/* Grid texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3f3f46 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
              <div className="flex flex-col gap-5 max-w-xl">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 28 28" fill="none" aria-hidden>
                    <line x1="14" y1="11" x2="14" y2="2" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="6" y2="7" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="4" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="8" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="14" y2="26" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="21" y2="21" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="25" y2="14" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="14" y1="11" x2="21" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
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
                    Ready?
                  </span>
                </div>

                <h2
                  className="font-bold text-zinc-50 leading-tight tracking-tight"
                  style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
                >
                  Start chatting with
                  <br />
                  your documents.
                </h2>

                <p className="text-zinc-500 text-base">
                  Set up your first workspace in under two minutes.
                  <br className="hidden sm:block" />
                  No configuration, no credit card required.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-sky-400 text-zinc-950 text-sm font-mono font-bold uppercase tracking-[0.15em] hover:bg-sky-300 active:bg-sky-500 transition-colors text-center"
                >
                  Create a workspace →
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border border-zinc-700 text-zinc-400 text-sm font-mono uppercase tracking-[0.15em] hover:border-zinc-500 hover:text-zinc-100 transition-colors text-center"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
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
            <span className="text-xs font-mono text-zinc-700 uppercase tracking-[0.3em]">
              CRTX
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-800">
            Document Intelligence Platform
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
