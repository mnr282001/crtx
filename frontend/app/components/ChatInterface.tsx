"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { queryQuestion } from "../api";
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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const result = await queryQuestion(q);
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
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 min-h-0 scroll-smooth">
        {messages.length === 0 && !loading && (
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
      <div className="border-t border-zinc-800 p-3 flex gap-2 items-end shrink-0 bg-zinc-950">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
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
            h-[42px] px-5 bg-amber-500 text-zinc-950
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
      <div className="max-w-[75%] bg-zinc-800 border border-zinc-700 px-4 py-2.5">
        <p className="text-sm text-zinc-100 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex flex-col gap-3 max-w-[88%]">
      <div className="border-l-2 border-amber-500/60 pl-4">
        <p
          className={`text-sm leading-7 whitespace-pre-wrap ${
            msg.isError ? "text-red-400 font-mono" : "text-zinc-200"
          }`}
        >
          {msg.content}
        </p>
      </div>

      {msg.sources && msg.sources.length > 0 && (
        <div className="pl-4 flex flex-col gap-1">
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
