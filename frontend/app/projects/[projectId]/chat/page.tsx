"use client";

import { useEffect, useRef, useState } from "react";
import { createSession, sendMessage } from "@/app/services/chat";
import { useParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Module-level store — lives outside React, survives unmount/remount ─────────
// Keyed by projectId so different projects don't share history
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
          return <strong key={i} style={{ fontWeight: 700, color: "#e2e8f0" }}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(part))
          return <em key={i} style={{ fontStyle: "italic", color: "#94a3b8" }}>{part.slice(1, -1)}</em>;
        if (/^`[^`]+`$/.test(part))
          return <code key={i} style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(20,184,166,.12)", color: "#5eead4", padding: "1px 5px", borderRadius: 4 }}>{part.slice(1, -1)}</code>;
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
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: level === 1 ? 16 : 14, color: "#e2e8f0", marginTop: 10, marginBottom: 4 }}>{inlineMarkdown(line.replace(/^#{1,3}\s/, ""))}</div>);
      i++; continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
      nodes.push(<ul key={`ul-${i}`} style={{ margin: "4px 0 4px 4px", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>{items.map((item, j) => <li key={j} style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.65 }}>{inlineMarkdown(item)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      nodes.push(<ol key={`ol-${i}`} style={{ margin: "4px 0 4px 4px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>{items.map((item, j) => <li key={j} style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.65 }}>{inlineMarkdown(item)}</li>)}</ol>);
      continue;
    }
    nodes.push(<div key={i} style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7 }}>{inlineMarkdown(line)}</div>);
    i++;
  }
  return <>{nodes}</>;
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", display: "inline-block", animation: "typing-bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 10 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0f766e,#14b8a6)", border: "1px solid rgba(20,184,166,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginBottom: 2 }}>⚡</div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 3 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 500, paddingInline: 4 }}>
          {isUser ? "You" : "ANKY"}
        </div>
        <div style={{ padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg,#1e3a5f,#1e40af)" : "rgba(255,255,255,.05)", border: isUser ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.09)", wordBreak: "break-word" }}>
          {isUser
            ? <span style={{ fontSize: 14, color: "#bfdbfe", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</span>
            : <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{renderMarkdown(msg.content)}</div>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // Read initial state from module-level store (survives tab switches)
  const store = getProjectStore(projectId);

  const [sessionId, setSessionId]             = useState<string>(store.sessionId);
  const [messages, setMessages]               = useState<Message[]>(store.messages);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [sessionReady, setSessionReady]       = useState(!!store.sessionId);
  const [error, setError]                     = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Create session only if none exists for this project
  useEffect(() => {
    const s = getProjectStore(projectId);
    if (s.sessionId) {
      // Already have a session — restore state
      setSessionId(s.sessionId);
      setMessages([...s.messages]);
      setSessionReady(true);
      return;
    }
    createSession(projectId)
      .then(res => {
        s.sessionId = res.id;
        setSessionId(res.id);
        setSessionReady(true);
      })
      .catch(() => setError("Failed to start session. Please refresh."));
  }, [projectId]);

  // Scroll to bottom when messages or loading changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
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

    // Update both state and module store atomically
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

  function handleClear() {
    getProjectStore(projectId).messages = [];
    setMessages([]);
    setShowClearConfirm(false);
    setError(null);
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
        @keyframes pulse-ring    { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.8);opacity:0} }
        @keyframes fade-in       { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        .chat-input::placeholder { color:#2d3f55; }
        .chat-input:focus        { outline:none; }
        .send-btn:hover:not(:disabled) { background:rgba(20,184,166,.2)!important;border-color:rgba(20,184,166,.5)!important; }
        .send-btn:disabled             { opacity:.3;cursor:not-allowed; }
        .clear-btn:hover { background:rgba(239,68,68,.1)!important;border-color:rgba(239,68,68,.25)!important;color:#fca5a5!important; }
        .msg-row { animation: msg-in .25s ease both; }
        .chat-scroll::-webkit-scrollbar       { width:4px; }
        .chat-scroll::-webkit-scrollbar-track { background:transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.07);border-radius:4px; }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:0, overflow:"hidden" }}>

        {/* ── Header ── */}
        <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#0f766e,#14b8a6)", border:"1px solid rgba(20,184,166,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, position:"relative", flexShrink:0 }}>
              ⚡
              {sessionReady && <span style={{ position:"absolute", bottom:1, right:1, width:8, height:8, borderRadius:"50%", background:"#14b8a6", border:"1.5px solid #0d1117" }} />}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>ANKY</div>
              <div style={{ fontSize:11, color:sessionReady?"#14b8a6":"#475569", display:"flex", alignItems:"center", gap:5 }}>
                {sessionReady
                  ? <><span style={{ width:5, height:5, borderRadius:"50%", background:"#14b8a6", display:"inline-block", animation:"pulse-ring 2s ease-out infinite" }} />Ready · Semantic search active</>
                  : "Starting session…"}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {messages.length > 0 && (
              <div style={{ fontSize:11, color:"#334155", padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
                {messages.filter(m => m.role==="user").length} messages
              </div>
            )}
            {messages.length > 0 && !showClearConfirm && (
              <button className="clear-btn" onClick={() => setShowClearConfirm(true)}
                style={{ padding:"5px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.03)", color:"#475569", fontSize:11, cursor:"pointer", transition:"all .2s" }}>
                Clear chat
              </button>
            )}
            {showClearConfirm && (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:11, color:"#64748b" }}>Clear all messages?</span>
                <button onClick={handleClear} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(239,68,68,.3)", background:"rgba(239,68,68,.1)", color:"#fca5a5", fontSize:11, cursor:"pointer" }}>Yes, clear</button>
                <button onClick={() => setShowClearConfirm(false)} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,.08)", background:"transparent", color:"#475569", fontSize:11, cursor:"pointer" }}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={scrollRef} className="chat-scroll" style={{ flex:1, overflowY:"auto", minHeight:0, display:"flex", flexDirection:"column" }}>

          {isEmpty && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"40px 24px", animation:"fade-in .5s ease both" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,rgba(15,118,110,.3),rgba(20,184,166,.15))", border:"1px solid rgba(20,184,166,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⚡</div>
              <div style={{ textAlign:"center" }}>
                <h2 style={{ fontSize:18, fontWeight:600, color:"#e2e8f0", margin:"0 0 6px" }}>Ask ANKY anything</h2>
                <p style={{ fontSize:13, color:"#475569", maxWidth:360, lineHeight:1.6, margin:0 }}>
                  Describe an incident or ask a question — I'll search across your documents and historical incidents to find answers.
                </p>
              </div>
            </div>
          )}

          {!isEmpty && (
            <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16 }}>
              {messages.map((msg, i) => (
                <div key={i} className="msg-row">
                  <MessageBubble msg={msg} />
                </div>
              ))}
              {loading && (
                <div className="msg-row" style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0f766e,#14b8a6)", border:"1px solid rgba(20,184,166,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>⚡</div>
                  <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"18px 18px 18px 4px" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}

          {isEmpty && loading && (
            <div style={{ padding:"0 24px 24px", display:"flex", alignItems:"flex-end", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#0f766e,#14b8a6)", border:"1px solid rgba(20,184,166,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>⚡</div>
              <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"18px 18px 18px 4px" }}>
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding:"0 24px 16px", display:"flex", justifyContent:"center" }}>
              <div style={{ padding:"10px 16px", borderRadius:10, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div style={{ padding:"16px 24px 20px", borderTop:"1px solid rgba(255,255,255,.06)", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ width:"100%", maxWidth:720 }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, background:"rgba(255,255,255,.04)", border:`1px solid ${input?"rgba(20,184,166,.4)":"rgba(255,255,255,.09)"}`, borderRadius:16, padding:"10px 10px 10px 16px", transition:"border-color .2s", boxShadow: input?"0 0 0 3px rgba(20,184,166,.06)":"none" }}>
              <textarea ref={inputRef} className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={sessionReady ? "Describe an incident or ask a question…" : "Starting session…"}
                disabled={!sessionReady || loading} rows={1}
                style={{ flex:1, background:"transparent", border:"none", color:"#e2e8f0", fontSize:14, lineHeight:1.6, resize:"none", fontFamily:"inherit", minHeight:24, maxHeight:140, overflowY:"auto" }} />
              <button className="send-btn" onClick={() => handleSend()} disabled={!sessionReady || !input.trim() || loading}
                style={{ width:34, height:34, borderRadius:9, border:"1px solid rgba(20,184,166,.35)", background:"rgba(20,184,166,.1)", color:"#14b8a6", fontSize:17, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                {loading
                  ? <div style={{ width:14, height:14, border:"2px solid #14b8a6", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                  : "↑"}
              </button>
            </div>
            <div style={{ marginTop:6, fontSize:11, color:"#1e293b", textAlign:"center" }}>
              <kbd style={{ padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", fontSize:10, color:"#334155" }}>Enter</kbd>
              {" "}send ·{" "}
              <kbd style={{ padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", fontSize:10, color:"#334155" }}>Shift+Enter</kbd>
              {" "}new line
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
