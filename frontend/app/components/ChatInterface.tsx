"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import {
  queryQuestion,
  listChatSessions,
  createChatSession,
  getSessionMessages,
  deleteChatSession,
  renameChatSession,
} from "../api";
import SourceCard from "./SourceCard";
import ConfirmModal from "./ConfirmModal";
import ShareChatModal from "./ShareChatModal";

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

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatInterface({ collectionId = "", pipeline = "" }: { collectionId?: string; pipeline?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);
  const [shareSession, setShareSession] = useState<Session | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!collectionId) return;
    setMessagesLoading(true);
    setMessages([]);
    try {
      const rows: Array<{ id: string; role: "user" | "assistant"; content: string; sources?: Source[] }> =
        await getSessionMessages(collectionId, sessionId);
      setMessages(rows.map((r) => ({ id: r.id, role: r.role, content: r.content, sources: r.sources })));
    } catch {
      // silently ignore
    } finally {
      setMessagesLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    if (!collectionId) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      return;
    }

    let cancelled = false;
    setSessionsLoading(true);
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);

    listChatSessions(collectionId)
      .then(async (data: Session[]) => {
        if (cancelled) return;
        if (data.length > 0) {
          setSessions(data);
          setActiveSessionId(data[0].id);
          await loadSessionMessages(data[0].id);
        } else {
          const session: Session = await createChatSession(collectionId);
          if (cancelled) return;
          setSessions([session]);
          setActiveSessionId(session.id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSessionsLoading(false); });

    return () => { cancelled = true; };
  }, [collectionId, loadSessionMessages]);

  const selectSession = async (session: Session) => {
    setActiveSessionId(session.id);
    setShowSessions(false);
    await loadSessionMessages(session.id);
  };

  const newChat = async () => {
    if (!collectionId) return;
    try {
      const session: Session = await createChatSession(collectionId);
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setShowSessions(false);
    } catch {
      // silently ignore
    }
  };

  const removeSession = (session: Session) => {
    setOpenMenuId(null);
    setConfirmSession(session);
  };

  const startRename = (s: Session) => {
    setOpenMenuId(null);
    setRenamingId(s.id);
    setRenameValue(s.title || "");
  };

  const commitRename = async (s: Session) => {
    const newTitle = renameValue.trim();
    setRenamingId(null);
    if (!newTitle || newTitle === s.title || !collectionId) return;
    try {
      await renameChatSession(collectionId, s.id, newTitle);
      setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, title: newTitle } : x));
    } catch {
      // silently ignore
    }
  };

  const doRemoveSession = async () => {
    if (!confirmSession || !collectionId) return;
    const session = confirmSession;
    setConfirmSession(null);
    try {
      await deleteChatSession(collectionId, session.id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== session.id);
        if (activeSessionId === session.id) {
          if (next.length > 0) {
            setActiveSessionId(next[0].id);
            loadSessionMessages(next[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
        return next;
      });
    } catch {
      // silently ignore
    }
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading || !activeSessionId) return;

    // Capture before any state mutations — used to trigger title re-fetch after backend responds
    const isFirstMessage = messages.length === 0;

    const optimisticUser: Message = { id: `u-${Date.now()}`, role: "user", content: q };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const result = await queryQuestion(q, collectionId, pipeline, activeSessionId);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: result.answer, sources: result.sources },
      ]);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, updated_at: new Date().toISOString() };
        }).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      );
      // Re-fetch sessions to pull the AI-generated title the backend saved
      if (isFirstMessage && collectionId) {
        listChatSessions(collectionId)
          .then((data: Session[]) => setSessions(data))
          .catch(() => {});
      }
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

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
    {confirmSession && (
      <ConfirmModal
        message={`Delete "${confirmSession.title}"?`}
        confirmLabel="Delete"
        onConfirm={doRemoveSession}
        onCancel={() => setConfirmSession(null)}
      />
    )}
    {shareSession && collectionId && (
      <ShareChatModal
        collectionId={collectionId}
        session={shareSession}
        onClose={() => setShareSession(null)}
      />
    )}
    <div className="flex h-full min-h-0">
      {/* Sessions panel — desktop always visible, mobile overlay */}
      <aside
        className={[
          "flex flex-col border-r border-zinc-800 bg-zinc-950 shrink-0",
          "md:w-52 md:flex",
          showSessions ? "absolute inset-y-0 left-0 z-20 w-64 flex shadow-xl" : "hidden",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Chats</span>
          <button
            onClick={newChat}
            className="text-[10px] font-mono text-amber-500 hover:text-amber-400 uppercase tracking-[0.15em] transition-colors"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em] px-3 py-3">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.15em] px-3 py-3">No chats yet</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => selectSession(s)}
                className={[
                  "group relative flex items-center gap-1 px-3 py-2.5 cursor-pointer border-b border-zinc-900 transition-colors",
                  s.id === activeSessionId
                    ? "bg-zinc-800 border-l-2 border-l-amber-500"
                    : "hover:bg-zinc-900",
                ].join(" ")}
              >
                {renamingId === s.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitRename(s); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 text-xs font-mono bg-transparent border-b border-amber-500/60 text-zinc-100 outline-none"
                  />
                ) : (
                  <p className={[
                    "flex-1 min-w-0 text-xs font-mono leading-snug break-words",
                    s.id === activeSessionId ? "text-zinc-100" : "text-zinc-400",
                  ].join(" ")}>
                    {s.title || "New Chat"}
                  </p>
                )}

                {/* 3-dot menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id); }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 text-sm leading-none px-0.5 transition-all"
                    title="Options"
                  >
                    ⋮
                  </button>
                  {openMenuId === s.id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-5 z-30 bg-zinc-900 border border-zinc-700 shadow-xl min-w-[110px] py-1">
                        {(s.id !== activeSessionId || messages.length > 0) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(s); }}
                            className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                          >
                            Rename
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSession(s); }}
                          className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-red-400 hover:bg-zinc-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {showSessions && (
        <div
          className="md:hidden fixed inset-0 z-10 bg-black/60"
          onClick={() => setShowSessions(false)}
        />
      )}

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setShowSessions((v) => !v)}
            className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] hover:text-zinc-300 transition-colors"
          >
            ☰ Chats
          </button>
          {activeSession && (
            <p className="text-xs font-mono text-zinc-500 truncate flex-1">{activeSession.title || "New Chat"}</p>
          )}
          {activeSession && messages.length > 0 && (
            <button
              onClick={() => setShareSession(activeSession)}
              className="text-[10px] font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-[0.15em] shrink-0 transition-colors"
            >
              ↗ Share
            </button>
          )}
          <button
            onClick={newChat}
            className="text-[10px] font-mono text-amber-500 hover:text-amber-400 uppercase tracking-[0.15em] shrink-0"
          >
            + New
          </button>
        </div>

        {/* Desktop title bar */}
        {activeSession && (
          <div className="hidden md:flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0">
            <span className="text-xs font-mono text-zinc-300 truncate">{activeSession.title || "New Chat"}</span>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {messages.length > 0 && (
                <button
                  onClick={() => setShareSession(activeSession)}
                  className="text-[10px] font-mono text-zinc-500 hover:text-amber-400 uppercase tracking-[0.15em] transition-colors"
                >
                  ↗ Share
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === "__titlebar__" ? null : "__titlebar__")}
                  className="text-zinc-500 hover:text-zinc-200 text-sm leading-none px-0.5 transition-colors"
                  title="Options"
                >
                  ⋮
                </button>
                {openMenuId === "__titlebar__" && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 top-6 z-30 bg-zinc-900 border border-zinc-700 shadow-xl min-w-[110px] py-1">
                      {messages.length > 0 && (
                        <button
                          onClick={() => { startRename(activeSession); }}
                          className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          Rename
                        </button>
                      )}
                      <button
                        onClick={() => { setOpenMenuId(null); removeSession(activeSession); }}
                        className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-red-400 hover:bg-zinc-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4 sm:gap-5 min-h-0 scroll-smooth">
          {!activeSessionId && !sessionsLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
                {collectionId ? "Starting chat…" : "Select a collection"}
              </p>
            </div>
          )}

          {messagesLoading && (
            <div className="flex-1 flex items-center justify-center opacity-40">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Loading…</p>
            </div>
          )}

          {!messagesLoading && messages.length === 0 && activeSessionId && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
              <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-zinc-600" style={{ opacity: 0.3 + (i % 3) * 0.2 }} />
                ))}
              </div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Awaiting query</p>
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
              disabled={loading || !activeSessionId}
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
            disabled={loading || !input.trim() || !activeSessionId}
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
    </div>
    </>
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
          <p className="text-sm leading-7 text-red-400 font-mono whitespace-pre-wrap">{msg.content}</p>
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
            <SourceCard key={`${src.source}-${src.chunk_index}-${i}`} source={src} />
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
