"use client";

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { getIngestJob, ingestFile, ingestUrl } from "../api";

interface FileEntry {
  id: string;
  name: string;
  status: "uploading" | "queued" | "processing" | "done" | "partial" | "error";
  progress: number;
  chunks?: number;
  chunksTotal?: number;
  error?: string;
}

interface UploadZoneProps {
  onIngested?: () => void;
  collectionId?: string;
}

const POLL_INTERVAL_MS = 1500;

const ACCEPTED_EXTENSIONS = [
  ".pdf", ".csv", ".xlsx", ".docx", ".pptx", ".txt", ".md",
];

const ACCEPT_ATTR =
  ".pdf,.csv,.xlsx,.docx,.pptx,.txt,.md," +
  "application/pdf," +
  "text/csv," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation," +
  "text/plain," +
  "text/markdown";

function isSupported(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

async function pollJob(
  jobId: string,
  onUpdate: (entry: Partial<FileEntry>) => void,
): Promise<void> {
  while (true) {
    const job = await getIngestJob(jobId);

    if (job.status === "succeeded") {
      onUpdate({ status: "done", progress: 100, chunks: job.chunks_processed });
      return;
    }

    if (job.status === "failed") {
      throw new Error(job.error_message ?? "Ingest failed");
    }

    if (job.status === "partial") {
      onUpdate({
        status: "partial",
        progress: 100,
        chunks: job.chunks_processed,
        error: job.error_message ?? undefined,
      });
      return;
    }

    if (job.chunks_total && job.chunks_total > 0) {
      const pct = Math.round((job.chunks_processed / job.chunks_total) * 90) + 5;
      onUpdate({
        status: job.status === "queued" ? "queued" : "processing",
        progress: pct,
        chunksTotal: job.chunks_total,
      });
    } else {
      onUpdate({ status: job.status === "queued" ? "queued" : "processing" });
    }

    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

export default function UploadZone({ onIngested, collectionId = "" }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [rejection, setRejection] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rejectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const showRejection = useCallback((message: string) => {
    setRejection(message);
    if (rejectionTimer.current) clearTimeout(rejectionTimer.current);
    rejectionTimer.current = setTimeout(() => setRejection(null), 4000);
  }, []);

  const process = useCallback(
    async (incoming: File[]) => {
      const supported = incoming.filter(isSupported);
      const rejected = incoming.filter((f) => !isSupported(f));

      if (rejected.length > 0) {
        const names = rejected.map((f) => f.name).join(", ");
        showRejection(
          rejected.length === 1
            ? `"${rejected[0].name}" is not a supported file type.`
            : `${rejected.length} files aren't supported: ${names}`
        );
      }

      if (!supported.length) return;

      const entries: FileEntry[] = supported.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...entries]);

      for (const entry of entries) {
        const { id, name } = entry;
        try {
          const { job_id } = await ingestFile(
            supported.find((f) => f.name === name)!,
            collectionId,
          );
          updateEntry(id, { status: "queued", progress: 2 });
          await pollJob(job_id, (patch) => updateEntry(id, patch));
          onIngested?.();
        } catch (err) {
          updateEntry(id, {
            status: "error",
            progress: 0,
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }
    },
    [collectionId, onIngested, updateEntry, showRejection],
  );

  const submitUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      showRejection("Please enter a valid http or https URL.");
      return;
    }
    setUrlInput("");

    const id = `url-${Date.now()}-${Math.random()}`;
    setFiles((prev) => [
      ...prev,
      { id, name: url, status: "uploading", progress: 0 },
    ]);

    try {
      const { job_id } = await ingestUrl(url, collectionId);
      updateEntry(id, { status: "queued", progress: 2 });
      await pollJob(job_id, (patch) => updateEntry(id, patch));
      onIngested?.();
    } catch (err) {
      updateEntry(id, {
        status: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Ingest failed",
      });
    }
  }, [urlInput, collectionId, onIngested, updateEntry, showRejection]);

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    process(Array.from(e.dataTransfer.files));
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) process(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative cursor-pointer border border-dashed p-5 flex flex-col items-center justify-center gap-2.5 select-none transition-all duration-150",
          dragging
            ? "border-sky-400 bg-sky-400/5 shadow-[inset_0_0_30px_rgba(56,189,248,0.05)]"
            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={onChange}
          className="sr-only"
        />

        <div className={`transition-colors ${dragging ? "text-sky-400" : "text-zinc-700"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        <p className={`text-[11px] font-mono uppercase tracking-[0.18em] transition-colors ${dragging ? "text-sky-400" : "text-zinc-500"}`}>
          {dragging ? "Release to upload" : "Drop files or click to browse"}
        </p>
      </div>

      {/* Rejection message */}
      {rejection && (
        <div className="flex items-start gap-2 border border-red-400/20 bg-red-400/5 px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 mt-0.5">
            <circle cx="6" cy="6" r="5" stroke="#f87171" strokeWidth="1" />
            <line x1="6" y1="3.5" x2="6" y2="6.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.6" fill="#f87171" />
          </svg>
          <p className="text-[11px] font-mono text-red-400/80 leading-relaxed">{rejection}</p>
        </div>
      )}

      {/* URL input */}
      <div className="flex gap-1">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUrl()}
          placeholder="https://example.com/page"
          className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder-zinc-700 font-mono text-xs px-3 py-2 outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          onClick={submitUrl}
          disabled={!urlInput.trim()}
          className="bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs px-3 py-2 transition-colors shrink-0"
        >
          Ingest
        </button>
      </div>

      {/* File progress list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {files.map((entry) => (
            <FileRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ entry }: { entry: FileEntry }) {
  const isActive =
    entry.status === "uploading" ||
    entry.status === "queued" ||
    entry.status === "processing";
  const isDone = entry.status === "done";
  const isPartial = entry.status === "partial";
  const isError = entry.status === "error";

  const statusLabel = () => {
    if (entry.status === "uploading")
      return <span className="text-sky-400 tabular-nums">{Math.round(entry.progress)}%</span>;
    if (entry.status === "queued")
      return <span className="text-zinc-600">queued</span>;
    if (entry.status === "processing")
      return <span className="text-sky-400 tabular-nums">{Math.round(entry.progress)}%</span>;
    if (isDone)
      return <span className="text-emerald-400">✓ {entry.chunks}c</span>;
    if (isPartial)
      return <span className="text-sky-300">~ {entry.chunks}c</span>;
    if (isError)
      return <span className="text-red-400">failed</span>;
  };

  const barColor = isDone
    ? "bg-emerald-500"
    : isPartial
    ? "bg-sky-400"
    : isError
    ? "bg-red-500"
    : "bg-sky-400";

  return (
    <div className="border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 font-mono text-xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-zinc-400 truncate flex-1 text-[11px]">{entry.name}</span>
        <span className="text-[10px] shrink-0">{statusLabel()}</span>
      </div>
      <div className="h-px bg-zinc-800">
        {(isActive || isDone || isPartial || isError) && (
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${isDone || isPartial || isError ? 100 : entry.progress}%` }}
          />
        )}
      </div>
      {(isError || isPartial) && entry.error && (
        <p className={`mt-1.5 text-[10px] leading-tight truncate ${isPartial ? "text-sky-300/70" : "text-red-400/70"}`}>
          {entry.error}
        </p>
      )}
    </div>
  );
}
