import Link from "next/link";

export default function ClosingCTA() {
  return (
    <>
      {/* CTA section */}
      <section className="border-t border-zinc-800 py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="relative border border-zinc-800 p-10 sm:p-14 lg:p-20 overflow-hidden">
            {/* Decorative amber glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "-60px",
                right: "-60px",
                width: "400px",
                height: "400px",
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)",
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
                  <div className="w-1.5 h-1.5 bg-amber-500" />
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
                  className="px-8 py-4 bg-amber-500 text-zinc-950 text-sm font-mono font-bold uppercase tracking-[0.15em] hover:bg-amber-400 active:bg-amber-600 transition-colors text-center"
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
            <div className="w-1.5 h-1.5 bg-amber-500" />
            <span className="text-xs font-mono text-zinc-700 uppercase tracking-[0.3em]">
              CRTX
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-800">
            Document Intelligence Platform
          </p>
        </div>
      </footer>
    </>
  );
}
