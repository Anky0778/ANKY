"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BarChart3, MessageSquare, Gauge, Layers, Bot, Target, TrendingUp, AlertCircle } from "lucide-react";
import { fetchAnalytics } from "app/services/analytics";

export default function AnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics(projectId)
      .then(setData)
      .catch(() => setError("Failed to load analytics"));
  }, [projectId]);

  if (error) {
    return (
      <div className="page">
        <div className="state-block">
          <div className="state-icon"><AlertCircle size={20} color="var(--danger)" /></div>
          <div className="state-title">Couldn&apos;t load analytics</div>
          <div className="state-desc">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 24, width: 220, marginBottom: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    );
  }

  const incidents = data.incident_count || 0;
  const sessions = data.chat_sessions_count || 0;
  const messages = data.message_count || 0;
  const aiCalls = data.ai_calls || 0;

  const utilization = incidents > 0 ? ((sessions / incidents) * 100).toFixed(1) : "0";
  const engagement = sessions > 0 ? (messages / sessions).toFixed(2) : "0";
  const aiAssistRatio = messages > 0 ? ((aiCalls / messages) * 100).toFixed(1) : "0";
  const coverage = incidents > 0 ? ((sessions / incidents) * 100).toFixed(1) : "0";

  const insight =
    incidents === 0
      ? "No incident data uploaded yet."
      : sessions === 0
      ? "AI is not being used. Consider training and promoting usage."
      : Number(utilization) < 10
      ? "Low AI adoption detected. Engineers are not leveraging intelligence consistently."
      : "AI adoption is healthy. Intelligence is integrated into the workflow.";

  const insightTone = incidents === 0 || sessions === 0 || Number(utilization) < 10 ? "warning" : "success";

  const metrics = [
    { icon: AlertCircle, title: "Total incidents", value: incidents, subtitle: "Historical incident records" },
    { icon: MessageSquare, title: "AI sessions", value: sessions, subtitle: "Chat sessions created" },
    { icon: Gauge, title: "Intelligence utilization", value: `${utilization}%`, subtitle: "Sessions per incident" },
    { icon: Layers, title: "Engagement depth", value: engagement, subtitle: "Avg messages per session" },
    { icon: Bot, title: "AI assist ratio", value: `${aiAssistRatio}%`, subtitle: "AI responses per message" },
    { icon: Target, title: "Incident coverage", value: `${coverage}%`, subtitle: "Incidents touched by AI" },
  ];

  return (
    <div className="page" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <BarChart3 size={20} color="var(--brand)" />
        <h1 className="page-title">Intelligence analytics</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div className="metric-card" key={m.title}>
            <div className="metric-label"><m.icon size={13} /> {m.title}</div>
            <div className="metric-value">{m.value}</div>
            <div className="text-faint" style={{ fontSize: "var(--fs-xs)", marginTop: 6 }}>{m.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div className="state-icon" style={{ margin: 0, color: insightTone === "success" ? "var(--success)" : "var(--warning)" }}>
          <TrendingUp size={18} />
        </div>
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Operational health insight</div>
          <p className="section-text">{insight}</p>
        </div>
      </div>
    </div>
  );
}
