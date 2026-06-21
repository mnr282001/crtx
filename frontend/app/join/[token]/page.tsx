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
        <div className="w-1.5 h-1.5 bg-amber-500" />
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
