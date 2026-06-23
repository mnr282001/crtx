"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { joinViaShare } from "../../api";
import { useAuth } from "../../context/auth";
import { useCollections } from "../../context/collections";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const { refresh, setActiveId } = useCollections();
  const router = useRouter();
  const [status, setStatus] = useState<"joining" | "done" | "error">("joining");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=/join/${token}`);
      return;
    }

    joinViaShare(token)
      .then((res) => {
        setStatus("done");
        const name = res.collection?.name ?? "collection";
        if (res.already_owner) {
          setMessage(`You own "${name}".`);
        } else if (res.already_member) {
          setMessage(`You already have access to "${name}".`);
        } else {
          setMessage(`Joined "${name}" with ${res.permission} permission.`);
        }
        refresh().then(() => setActiveId(res.collection.id));
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message);
      });
  }, [loading, user, token, router, refresh, setActiveId]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950">
      <div className="flex flex-col gap-4 items-center text-center max-w-sm px-4">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden>
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
        {status === "joining" && (
          <p className="text-sm font-mono text-zinc-400">Joining collection…</p>
        )}
        {status === "done" && (
          <>
            <p className="text-sm font-mono text-emerald-400">{message}</p>
            <button
              onClick={() => router.replace("/")}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-[0.15em] transition-colors"
            >
              Go to app →
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm font-mono text-red-400">{message}</p>
            <button
              onClick={() => router.replace("/")}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-[0.15em] transition-colors"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
