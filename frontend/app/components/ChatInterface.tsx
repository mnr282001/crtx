"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import { queryQuestion, getChatHistory } from "../api";
import SourceCard from "./SourceCard";

interface Source {
  source: string;
  chunk_index: number;
  text: string;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isError?: boolean;
}

export default function ChatInterface({ collectionId = "", pipeline = "" }: { collectionId?: string; pipeline?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!collectionId) {
      setMessages([]);
      return;
    }
    setMessages([]);
    setHistoryLoading(true);
    getChatHistory(collectionId)
      .then((rows: Array<{ id: string; role: "user" | "assistant"; content: string; sources?: Source[] }>) => {
        setMessages(rows.map((r) => ({ id: r.id, role: r.role, content: r.content, sources: r.sources })));
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [collectionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: q },
    ]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const result = await queryQuestion(q, collectionId, pipeline);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Request failed.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const t = e.target;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 144)}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4 sm:gap-5 min-h-0 scroll-smooth">
        {messages.length === 0 && !loading && historyLoading && (
          <div className="flex-1 flex items-center justify-center opacity-40">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Loading history…</p>
          </div>
        )}

        {messages.length === 0 && !loading && !historyLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
            <div className="grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-zinc-600"
                  style={{ opacity: 0.3 + (i % 3) * 0.2 }}
                />
              ))}
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
              Awaiting query
            </p>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} content={msg.content} />
          ) : (
            <AssistantBubble key={msg.id} msg={msg} />
          )
        )}

        {loading && <ThinkingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-800 p-2 sm:p-3 flex gap-2 items-end shrink-0 bg-zinc-950">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Ask a question…"
            rows={1}
            disabled={loading}
            className="
              w-full bg-zinc-900 border border-zinc-700 text-zinc-100
              text-sm font-mono placeholder:text-zinc-600
              px-3 py-2.5 resize-none outline-none
              focus:border-amber-500/70 transition-colors duration-100
              disabled:opacity-40
            "
            style={{ minHeight: "42px" }}
          />
        </div>
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="
            h-[42px] px-4 sm:px-5 bg-amber-500 text-zinc-950
            text-xs font-mono font-bold uppercase tracking-[0.15em]
            hover:bg-amber-400 active:bg-amber-600
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors duration-100 shrink-0
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[90%] sm:max-w-[75%] bg-zinc-800 border border-zinc-700 px-3 sm:px-4 py-2.5">
        <p className="text-sm text-zinc-100 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex flex-col gap-3 max-w-full sm:max-w-[88%]">
      <div className="border-l-2 border-amber-500/60 pl-3 sm:pl-4">
        {msg.isError ? (
          <p className="text-sm leading-7 text-red-400 font-mono whitespace-pre-wrap">
            {msg.content}
          </p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-sm leading-7 text-zinc-200 mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
              em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-sm text-zinc-200">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm text-zinc-200">{children}</ol>,
              li: ({ children }) => <li className="leading-7">{children}</li>,
              h1: ({ children }) => <h1 className="text-base font-bold text-zinc-100 mb-2 mt-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-zinc-100 mb-1 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1 mt-2">{children}</h3>,
              code: ({ children }) => <code className="bg-zinc-800 text-amber-400 px-1 py-0.5 text-xs font-mono rounded">{children}</code>,
              pre: ({ children }) => <pre className="bg-zinc-900 border border-zinc-700 p-3 mb-2 overflow-x-auto text-xs font-mono text-zinc-300">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-600 pl-3 text-zinc-400 italic mb-2">{children}</blockquote>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>

      {msg.sources && msg.sources.length > 0 && (
        <div className="pl-3 sm:pl-4 flex flex-col gap-1">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.15em] mb-1">
            Sources · {msg.sources.length}
          </p>
          {msg.sources.map((src, i) => (
            <SourceCard
              key={`${src.source}-${src.chunk_index}-${i}`}
              source={src}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="border-l-2 border-amber-500/60 pl-4">
      <div className="flex gap-1.5 items-center h-7">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-amber-500/60 animate-bounce"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
