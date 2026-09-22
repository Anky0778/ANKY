"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Zap, Send, AlertCircle, X } from "lucide-react";
import { createSession, sendMessage } from "@/app/services/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Module-level store — lives outside React, survives unmount/remount ─────────
const chatStore: Record<string, { sessionId: string; messages: Message[] }> = {};

function getProjectStore(projectId: string) {
  if (!chatStore[projectId]) {
    chatStore[projectId] = { sessionId: "", messages: [] };
  }
  return chatStore[projectId];
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part))
          return <strong key={i} style={{ fontWeight: 700, color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(part))
          return <em key={i} style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>{part.slice(1, -1)}</em>;
        if (/^`[^`]+`$/.test(part))
          return (
            <code key={i} style={{ fontFamily: "monospace", fontSize: 12, background: "var(--brand-subtle)", color: "var(--brand)", padding: "1px 5px", borderRadius: 4 }}>
              {part.slice(1, -1)}
            </code>
          );
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { nodes.push(<div key={`sp-${i}`} style={{ height: 6 }} />); i++; continue; }
    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^(#{1,3})/)?.[1] ?? "#").length;
      nodes.push(
        <div key={i} style={{ fontWeight: 700, fontSize: level === 1 ? 16 : 14, color: "var(--text-primary)", marginTop: 10, marginBottom: 4 }}>
          {inlineMarkdown(line.replace(/^#{1,3}\s/, ""))}
        </div>
      );
      i++; continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: "4px 0 4px 4px", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item, j) => <li key={j} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{inlineMarkdown(item)}</li>)}
        </ul>
      );
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: "4px 0 4px 4px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((item, j) => <li key={j} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{inlineMarkdown(item)}</li>)}
        </ol>
      );
      continue;
    }
    nodes.push(<div key={i} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{inlineMarkdown(line)}</div>);
    i++;
  }
  return <>{nodes}</>;
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", display: "inline-block", animation: "typing-bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function Avatar() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "var(--radius-md)",
        background: "var(--brand)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      <Zap size={14} />
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 10 }}>
      {!isUser && <Avatar />}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 3 }}>
        <div style={{ fontSize: 10, color: "var(--text-disabled)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, paddingInline: 4 }}>
          {isUser ? "You" : "ANKY"}
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser ? "var(--brand)" : "var(--surface-2)",
            border: isUser ? "1px solid var(--brand-hover)" : "1px solid var(--border-subtle)",
            wordBreak: "break-word",
          }}
        >
          {isUser ? (
            <span style={{ fontSize: 14, color: "#fff", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{renderMarkdown(msg.content)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const store = getProjectStore(projectId);

  const [sessionId, setSessionId] = useState<string>(store.sessionId);
  const [messages, setMessages] = useState<Message[]>(store.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(!!store.sessionId);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const s = getProjectStore(projectId);
    if (s.sessionId) {
      setSessionId(s.sessionId);
      setMessages([...s.messages]);
      setSessionReady(true);
      return;
    }
    createSession(projectId)
      .then((res) => {
        s.sessionId = res.id;
        setSessionId(res.id);
        setSessionReady(true);
      })
      .catch(() => setError("Failed to start session. Please refresh."));
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!sessionId || !content || loading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...getProjectStore(projectId).messages, userMsg];

    getProjectStore(projectId).messages = newMessages;
    setMessages([...newMessages]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await sendMessage(projectId, sessionId, content);
      const withReply = [...getProjectStore(projectId).messages, res];
      getProjectStore(projectId).messages = withReply;
      setMessages([...withReply]);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleClear() {
    setShowClearConfirm(false);
    setError(null);
    getProjectStore(projectId).messages = [];
    setMessages([]);
    setSessionReady(false);

    try {
      const res = await createSession(projectId);
      const s = getProjectStore(projectId);
      s.sessionId = res.id;
      setSessionId(res.id);
      setSessionReady(true);
    } catch {
      setError("Failed to reset session. Please refresh.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <>
      <style>{`
        @keyframes msg-in        { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typing-bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        .chat-input::placeholder { color: var(--text-tertiary); }
        .chat-input:focus        { outline:none; }
        .send-btn:hover:not(:disabled) { background: var(--brand-hover) !important; }
        .send-btn:disabled             { opacity:.4; cursor:not-allowed; }
        .msg-row { animation: msg-in .2s ease both; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>ANKY</div>
              <div style={{ fontSize: 11, color: sessionReady ? "var(--success)" : "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
                {sessionReady ? (
                  <>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                    Ready · Semantic search active
                  </>
                ) : (
                  "Starting session…"
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {messages.length > 0 && (
              <span className="badge badge-neutral">{messages.filter((m) => m.role === "user").length} messages</span>
            )}
            {messages.length > 0 && !showClearConfirm && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowClearConfirm(true)}>
                Clear chat
              </button>
            )}
            {showClearConfirm && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Clear all messages?</span>
                <button className="btn btn-danger btn-sm" onClick={handleClear}>Yes, clear</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowClearConfirm(false)}>
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          {isEmpty && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 24px" }}>
              <div className="state-icon" style={{ width: 52, height: 52, color: "var(--brand)" }}>
                <Zap size={22} />
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Ask ANKY anything</h2>
                <p className="section-text" style={{ maxWidth: 360 }}>
                  Describe an incident or ask a question — I&apos;ll search across your documents and historical incidents to find answers.
                </p>
              </div>
            </div>
          )}

          {!isEmpty && (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} className="msg-row">
                  <MessageBubble msg={msg} />
                </div>
              ))}
              {loading && (
                <div className="msg-row" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <Avatar />
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: "16px 16px 16px 4px" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}

          {isEmpty && loading && (
            <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "flex-end", gap: 10 }}>
              <Avatar />
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: "16px 16px 16px 4px" }}>
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "0 24px 16px", display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "var(--radius-md)", background: "var(--danger-subtle)", border: "1px solid rgba(229,88,79,.3)", color: "var(--danger)", fontSize: 13 }}>
                <AlertCircle size={14} /> {error}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "16px 24px 20px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 720 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                background: "var(--surface-1)",
                border: `1px solid ${input ? "var(--brand)" : "var(--border-default)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "10px 10px 10px 16px",
                transition: "border-color var(--t-fast) var(--ease)",
                boxShadow: input ? "0 0 0 3px var(--brand-subtle)" : "none",
              }}
            >
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={sessionReady ? "Describe an incident or ask a question…" : "Starting session…"}
                disabled={!sessionReady || loading}
                rows={1}
                style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6, resize: "none", fontFamily: "inherit", minHeight: 24, maxHeight: 140, overflowY: "auto" }}
              />
              <button
                className="send-btn"
                onClick={() => handleSend()}
                disabled={!sessionReady || !input.trim() || loading}
                style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "none", background: "var(--brand)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background var(--t-fast) var(--ease)" }}
              >
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={15} />}
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-disabled)", textAlign: "center" }}>
              <kbd style={{ padding: "1px 5px", borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border-subtle)", fontSize: 10, color: "var(--text-tertiary)" }}>Enter</kbd>
              {" "}send ·{" "}
              <kbd style={{ padding: "1px 5px", borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border-subtle)", fontSize: 10, color: "var(--text-tertiary)" }}>Shift+Enter</kbd>
              {" "}new line
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
