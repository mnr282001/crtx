"use client";

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { getIngestJob, ingestPdf, ingestUrl } from "../api";

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

    // queued or processing — update progress bar if we have totals
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
  const inputRef = useRef<HTMLInputElement>(null);

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const process = useCallback(
    async (incoming: File[]) => {
      const pdfs = incoming.filter((f) => f.type === "application/pdf");
      if (!pdfs.length) return;

      const entries: FileEntry[] = pdfs.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...entries]);

      for (const entry of entries) {
        const { id, name } = entry;
        try {
          // Upload the file — server returns immediately with a job_id
          const { job_id } = await ingestPdf(
            pdfs.find((f) => f.name === name)!,
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
    [collectionId, onIngested, updateEntry],
  );

  const submitUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      alert("Please enter a valid http or https URL.");
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
  }, [urlInput, collectionId, onIngested, updateEntry]);

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
          "relative cursor-pointer border border-dashed p-6 sm:p-8 flex flex-col items-center justify-center gap-3 select-none transition-all duration-150",
          dragging
            ? "border-amber-500 bg-amber-500/5 shadow-[inset_0_0_40px_rgba(245,158,11,0.06)]"
            : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-500",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={onChange}
          className="sr-only"
        />

        <div className={`transition-colors ${dragging ? "text-amber-500" : "text-zinc-600"}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.2em]">
            {dragging ? "Release to ingest" : "Drop PDF files"}
          </p>
          <p className="text-xs font-mono text-zinc-700">or click to browse</p>
        </div>
      </div>

      {/* URL input */}
      <div className="flex gap-1">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUrl()}
          placeholder="https://example.com/page"
          className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-300 placeholder-zinc-600 font-mono text-xs px-3 py-2 outline-none focus:border-zinc-500"
        />
        <button
          onClick={submitUrl}
          disabled={!urlInput.trim()}
          className="bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs px-3 py-2 transition-colors shrink-0"
        >
          Ingest URL
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((entry) => (
            <FileRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ entry }: { entry: FileEntry }) {
  const isActive = entry.status === "uploading" || entry.status === "queued" || entry.status === "processing";
  const isDone = entry.status === "done";
  const isPartial = entry.status === "partial";
  const isError = entry.status === "error";

  const statusLabel = () => {
    if (entry.status === "uploading") return <span className="text-amber-500 shrink-0 tabular-nums">{Math.round(entry.progress)}%</span>;
    if (entry.status === "queued") return <span className="text-zinc-500 shrink-0">queued</span>;
    if (entry.status === "processing") {
      const pct = Math.round(entry.progress);
      const total = entry.chunksTotal;
      return (
        <span className="text-amber-500 shrink-0 tabular-nums">
          {total ? `${pct}%` : `${pct}%`}
        </span>
      );
    }
    if (isDone) return <span className="text-emerald-400 shrink-0">✓ {entry.chunks} chunks</span>;
    if (isPartial) return <span className="text-amber-400 shrink-0">~ {entry.chunks} chunks</span>;
    if (isError) return <span className="text-red-400 shrink-0">✗ failed</span>;
  };

  const barColor = isDone
    ? "bg-emerald-500"
    : isPartial
    ? "bg-amber-500"
    : isError
    ? "bg-red-500"
    : "bg-amber-500";

  return (
    <div className="border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-zinc-300 truncate flex-1">{entry.name}</span>
        {statusLabel()}
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
        <p className={`mt-1.5 text-xs leading-tight truncate ${isPartial ? "text-amber-400" : "text-red-400"}`}>
          {entry.error}
        </p>
      )}
    </div>
  );
}
