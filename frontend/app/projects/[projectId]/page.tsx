"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Mail,
  Bot,
  BookOpen,
  BarChart3,
  Settings2,
  ArrowRight,
  Zap,
  TrendingUp,
  Check,
} from "lucide-react";
import { fetchProjectById } from "@/app/services/projects";
import { fetchAnalytics } from "@/app/services/analytics";
import api from "@/app/services/api";

interface Project {
  id: string;
  name: string;
  description: string | null;
  is_trained: boolean;
  created_at: string;
}
interface Analytics {
  incident_count: number;
  chat_sessions_count: number;
  message_count: number;
  ai_calls: number;
  chat_usage_per_incident: number;
}
interface TrendWeek { week: string; sessions: number; ai_calls: number; }
interface Trend { weeks: TrendWeek[]; total_incidents: number; }

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function TrendChart({ trend }: { trend: Trend }) {
  const [tooltip, setTooltip] = useState<{ i: number; week: TrendWeek } | null>(null);
  const { weeks } = trend;
  const overallMax = Math.max(...weeks.map((w) => Math.max(w.sessions, w.ai_calls)), 1);
  const CHART_H = 150, BAR_W = 14, GAP = 5, GROUP_W = 44, LABEL_H = 26;
  const totalW = weeks.length * (GROUP_W + 10) + 40;
  const isEmpty = weeks.every((w) => w.sessions === 0 && w.ai_calls === 0);

  if (isEmpty) {
    return (
      <div className="state-block" style={{ padding: "40px 0" }}>
        <BarChart3 size={26} color="var(--text-tertiary)" />
        <p className="state-desc">No activity in the last 8 weeks. Start using Chat to see trends here.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 18, marginBottom: 14, fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--brand)", display: "inline-block" }} /> Chat sessions
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--success)", display: "inline-block" }} /> AI calls
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${CHART_H + LABEL_H + 10}`} style={{ display: "block", overflow: "visible" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = CHART_H * (1 - f);
          return (
            <g key={i}>
              <line x1={28} y1={y} x2={totalW} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={22} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{Math.round(overallMax * f)}</text>
            </g>
          );
        })}
        {weeks.map((w, i) => {
          const gx = 34 + i * (GROUP_W + 10);
          const sH = (w.sessions / overallMax) * CHART_H;
          const aH = (w.ai_calls / overallMax) * CHART_H;
          const isHovered = tooltip?.i === i;
          return (
            <g key={i} style={{ cursor: "pointer" }} onMouseEnter={() => setTooltip({ i, week: w })} onMouseLeave={() => setTooltip(null)}>
              {isHovered && <rect x={gx - 4} y={0} width={GROUP_W + 8} height={CHART_H} rx={4} fill="var(--surface-3)" />}
              <rect x={gx} y={CHART_H - sH} width={BAR_W} height={sH} rx={3} fill="var(--brand)" opacity={isHovered ? 1 : 0.85} />
              <rect x={gx + BAR_W + GAP} y={CHART_H - aH} width={BAR_W} height={aH} rx={3} fill="var(--success)" opacity={isHovered ? 1 : 0.85} />
              <text x={gx + GROUP_W / 2 - 2} y={CHART_H + LABEL_H} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">{w.week}</text>
            </g>
          );
        })}
        <line x1={28} y1={CHART_H} x2={totalW} y2={CHART_H} stroke="var(--border-default)" strokeWidth={1} />
        {tooltip && (() => {
          const gx = 34 + tooltip.i * (GROUP_W + 10);
          const tx = Math.min(gx + GROUP_W / 2, totalW - 60);
          const ty = Math.max(CHART_H - Math.max((tooltip.week.sessions / overallMax) * CHART_H, (tooltip.week.ai_calls / overallMax) * CHART_H) - 50, 4);
          return (
            <g>
              <rect x={tx - 46} y={ty} width={92} height={42} rx={6} fill="var(--surface-3)" stroke="var(--border-default)" strokeWidth={0.8} />
              <text x={tx} y={ty + 14} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">{tooltip.week.week}</text>
              <text x={tx} y={ty + 28} textAnchor="middle" fontSize={10} fill="var(--brand)">{tooltip.week.sessions} sessions</text>
              <text x={tx} y={ty + 40} textAnchor="middle" fontSize={10} fill="var(--success)">{tooltip.week.ai_calls} AI calls</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function StatCard({ icon, label, value, suffix = "" }: { icon: React.ReactNode; label: string; value: number; suffix?: string }) {
  const counted = useCounter(Math.round(value));
  return (
    <div className="metric-card">
      <div className="metric-label">{icon} {label}</div>
      <div className="metric-value">{value === 0 ? "—" : `${counted.toLocaleString()}${suffix}`}</div>
    </div>
  );
}

function PipelineStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        background: done ? "var(--success-subtle)" : "var(--surface-1)",
        border: `1px solid ${done ? "rgba(47, 184, 114, 0.25)" : "var(--border-subtle)"}`,
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: done ? "var(--success)" : "var(--text-disabled)" }} />
      <span style={{ fontSize: "var(--fs-sm)", color: done ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: done ? 500 : 400 }}>{label}</span>
      {done && <Check size={13} color="var(--success)" style={{ marginLeft: "auto" }} />}
    </div>
  );
}

export default function ProjectOverview() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const id = Array.isArray(projectId) ? projectId[0] : projectId;
    Promise.all([fetchProjectById(id), fetchAnalytics(id)])
      .then(([proj, anal]) => {
        setProject(proj);
        setAnalytics(anal);
        setLoading(false);
        api
          .get(`/projects/${id}/analytics/trend`)
          .then((r) => setTrend(r.data))
          .catch(() => setTrend({ weeks: [], total_incidents: anal?.incident_count ?? 0 }));
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading || !project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="spinner" style={{ width: 24, height: 24 }} />
          <span className="section-text">Loading workspace…</span>
        </div>
      </div>
    );
  }

  const trained = project.is_trained;
  const a = analytics;
  const aiRatio = a && a.message_count > 0 ? Math.round((a.ai_calls / a.message_count) * 100) : 0;

  const pipeline = [
    "Validate uploaded data",
    "Extract & normalize text",
    "Chunk documents",
    "Generate embeddings",
    "Build vector index",
    "Finalize intelligence layer",
  ];

  const insightText = (() => {
    if (!a || a.chat_sessions_count === 0) return null;
    if (a.chat_usage_per_incident < 0.1)
      return `Low AI adoption — only ${a.chat_sessions_count} session${a.chat_sessions_count !== 1 ? "s" : ""} across ${a.incident_count} incidents. Engineers aren't consistently using the assistant during triage.`;
    if (a.chat_usage_per_incident < 0.5)
      return `Moderate AI usage across ${a.incident_count} incidents. ${a.chat_sessions_count} sessions created — consider querying the assistant earlier in the investigation process.`;
    return `Strong AI engagement — ${a.chat_sessions_count} sessions across ${a.incident_count} incidents (${a.chat_usage_per_incident.toFixed(2)} per incident). Engineers are actively leveraging the assistant.`;
  })();

  const navCards = [
    { title: "Knowledge base", icon: BookOpen, desc: "Upload runbooks, architecture guides, and SOPs to expand the AI's understanding of your system.", href: `/projects/${projectId}/documents`, cta: "Manage documents" },
    { title: "Incident history", icon: AlertTriangle, desc: `${a?.incident_count ?? 0} incidents indexed. Import more from ServiceNow, Jira, or CSV to improve accuracy.`, href: `/projects/${projectId}/incidents`, cta: "View incidents" },
    { title: "Analytics", icon: BarChart3, desc: `${a?.chat_sessions_count ?? 0} sessions, ${a?.ai_calls ?? 0} AI calls logged. Explore root cause trends and failure patterns.`, href: `/projects/${projectId}/analytics`, cta: "Open analytics" },
  ];

  return (
    <div className="page" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div className="card" style={{ padding: "32px 36px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <span className={`badge ${trained ? "badge-success" : "badge-warning"}`} style={{ marginBottom: 12 }}>
              {trained ? "Intelligence ready" : "Training required"}
            </span>
            <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 700, letterSpacing: "-0.02em" }}>{project.name}</h1>
            <p className="section-text" style={{ marginTop: 8, maxWidth: 520 }}>{project.description || "No description provided."}</p>
            <p className="text-faint" style={{ marginTop: 6, fontSize: "var(--fs-xs)" }}>
              Workspace created {new Date(project.created_at).getFullYear()}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <div className="metric-card" style={{ textAlign: "center", padding: "10px 20px" }}>
              <div className="metric-label" style={{ justifyContent: "center" }}>AI status</div>
              <div style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: trained ? "var(--success)" : "var(--warning)", marginTop: 4 }}>
                {trained ? "Operational" : "Standby"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => router.push(`/projects/${projectId}/chat`)}>
                <MessageSquare size={15} /> Chat
              </button>
              <button className="btn btn-secondary" onClick={() => router.push(`/projects/${projectId}/training`)}>
                <Zap size={15} /> Training
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard icon={<AlertTriangle size={13} />} label="Incidents indexed" value={a?.incident_count ?? 0} />
        <StatCard icon={<MessageSquare size={13} />} label="Chat sessions" value={a?.chat_sessions_count ?? 0} />
        <StatCard icon={<Mail size={13} />} label="Messages sent" value={a?.message_count ?? 0} />
        <StatCard icon={<Bot size={13} />} label="Avg messages per session" value={aiRatio} suffix="%" />
      </div>

      {/* Trend + pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <div className="card">
          <h2 className="section-title">Activity trend</h2>
          <p className="section-text" style={{ marginBottom: 16 }}>
            Chat sessions &amp; AI calls — last 8 weeks
            {trend && trend.total_incidents > 0 && (
              <span style={{ marginLeft: 10, color: "var(--text-tertiary)" }}>· {trend.total_incidents.toLocaleString()} incidents total</span>
            )}
          </p>
          {trend ? (
            <TrendChart trend={trend} />
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          )}
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <h2 className="section-title">Intelligence pipeline</h2>
            <p className="section-text">{trained ? "All stages complete" : "Awaiting training trigger"}</p>
          </div>
          {pipeline.map((step) => (
            <PipelineStep key={step} label={step} done={trained} />
          ))}
          {!trained && (
            <button className="btn btn-primary" style={{ marginTop: 8, justifyContent: "center" }} onClick={() => router.push(`/projects/${projectId}/training`)}>
              <Zap size={15} /> Start training
            </button>
          )}
        </div>
      </div>

      {/* Usage insight */}
      {insightText && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div className="state-icon" style={{ margin: 0, color: "var(--brand)" }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="metric-label" style={{ marginBottom: 6 }}>Usage insight</div>
            <p className="section-text">{insightText}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => router.push(`/projects/${projectId}/analytics`)}>
            View analytics <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Nav cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {navCards.map((card) => (
          <div key={card.title} className="card card-interactive" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }} onClick={() => router.push(card.href)}>
            <div className="state-icon" style={{ margin: 0, color: "var(--brand)" }}>
              <card.icon size={18} />
            </div>
            <h3 style={{ fontSize: "var(--fs-md)", fontWeight: 600 }}>{card.title}</h3>
            <p className="section-text">{card.desc}</p>
            <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--brand)", fontWeight: 600 }}>
              {card.cta} <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* System summary */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div className="state-icon" style={{ margin: 0 }}>
          <Settings2 size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="metric-label" style={{ marginBottom: 10 }}>System architecture</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              "Semantic embeddings power contextual retrieval",
              "Vector index enables high-speed similarity search",
              "AI assists engineers in identifying root causes",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)", display: "inline-block", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
