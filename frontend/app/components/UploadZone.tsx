"use client";

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { ingestPdf, ingestUrl } from "../api";

interface FileEntry {
  id: string;
  name: string;
  file?: File;
  status: "uploading" | "done" | "error";
  progress: number;
  chunks?: number;
  error?: string;
}

interface UploadZoneProps {
  onIngested?: () => void;
  collectionId?: string;
}

export default function UploadZone({ onIngested, collectionId = "" }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback(
    async (incoming: File[]) => {
      const pdfs = incoming.filter((f) => f.type === "application/pdf");
      if (!pdfs.length) return;

      const entries: FileEntry[] = pdfs.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        file,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...entries]);

      for (const entry of entries) {
        const { id } = entry;
        let progress = 0;
        const tick = setInterval(() => {
          progress = Math.min(progress + Math.random() * 18, 88);
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress } : f))
          );
        }, 180);

        try {
          const result = await ingestPdf(entry.file!, collectionId);
          clearInterval(tick);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: "done", progress: 100, chunks: result.chunks }
                : f
            )
          );
          onIngested?.();
        } catch (err) {
          clearInterval(tick);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error:
                      err instanceof Error ? err.message : "Upload failed",
                  }
                : f
            )
          );
        }
      }
    },
    [onIngested, collectionId]
  );

  const submitUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setUrlInput("");

    const id = `url-${Date.now()}-${Math.random()}`;
    const entry: FileEntry = { id, name: url, status: "uploading", progress: 0 };
    setFiles((prev) => [...prev, entry]);

    let progress = 0;
    const tick = setInterval(() => {
      progress = Math.min(progress + Math.random() * 18, 88);
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
    }, 180);

    try {
      const result = await ingestUrl(url, collectionId);
      clearInterval(tick);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "done", progress: 100, chunks: result.chunks } : f
        )
      );
      onIngested?.();
    } catch (err) {
      clearInterval(tick);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "error", progress: 0, error: err instanceof Error ? err.message : "Ingest failed" }
            : f
        )
      );
    }
  }, [urlInput, collectionId, onIngested]);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
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

        {/* Icon */}
        <div
          className={`transition-colors ${dragging ? "text-amber-500" : "text-zinc-600"}`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
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
          <p className="text-xs font-mono text-zinc-700">
            or click to browse
          </p>
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
  return (
    <div className="border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-zinc-300 truncate flex-1">{entry.name}</span>
        {entry.status === "uploading" && (
          <span className="text-amber-500 shrink-0 tabular-nums">
            {Math.round(entry.progress)}%
          </span>
        )}
        {entry.status === "done" && (
          <span className="text-emerald-400 shrink-0">
            ✓ {entry.chunks} chunks
          </span>
        )}
        {entry.status === "error" && (
          <span className="text-red-400 shrink-0">✗ failed</span>
        )}
      </div>

      {/* Progress track */}
      <div className="h-px bg-zinc-800">
        {entry.status === "uploading" && (
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${entry.progress}%` }}
          />
        )}
        {entry.status === "done" && (
          <div className="h-full bg-emerald-500 w-full" />
        )}
        {entry.status === "error" && (
          <div className="h-full bg-red-500 w-full" />
        )}
      </div>

      {entry.status === "error" && entry.error && (
        <p className="text-red-400 mt-1.5 text-xs leading-tight truncate">
          {entry.error}
        </p>
      )}
    </div>
  );
}
