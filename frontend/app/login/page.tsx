"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/auth";

function LoginForm() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/";
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) { setError(error); return; }
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError(error); return; }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden>
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
        <span className="text-sm font-mono font-semibold tracking-[0.25em] uppercase text-zinc-100">
          CRTX
        </span>
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setInfo(null); }}
            className={`text-xs font-mono uppercase tracking-[0.15em] px-3 py-2 border-b-2 transition-colors ${
              mode === m
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-mono px-3 py-2.5 outline-none focus:border-sky-400/70 placeholder:text-zinc-600 transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm font-mono px-3 py-2.5 outline-none focus:border-sky-400/70 placeholder:text-zinc-600 transition-colors"
        />

        {error && <p className="text-xs font-mono text-red-400">{error}</p>}
        {info && <p className="text-xs font-mono text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 py-2.5 bg-sky-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-[0.15em] hover:bg-sky-300 active:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
