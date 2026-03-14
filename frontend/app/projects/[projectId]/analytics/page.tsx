"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics } from "app/services/analytics";
import { useParams } from "next/navigation";

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

  if (error) return <div style={styles.error}>{error}</div>;
  if (!data) return <div style={styles.loading}>Loading analytics...</div>;

  const incidents = data.incident_count || 0;
  const sessions = data.chat_sessions_count || 0;
  const messages = data.message_count || 0;
  const aiCalls = data.ai_calls || 0;

  const utilization =
    incidents > 0 ? ((sessions / incidents) * 100).toFixed(1) : "0";

  const engagement =
    sessions > 0 ? (messages / sessions).toFixed(2) : "0";

  const aiAssistRatio =
    messages > 0 ? ((aiCalls / messages) * 100).toFixed(1) : "0";

  const coverage =
    incidents > 0 ? ((sessions / incidents) * 100).toFixed(1) : "0";

  return (
    <div style={styles.wrapper}>
      <h2 style={{ marginBottom: "30px" }}>Intelligence Analytics</h2>

      <div style={styles.grid}>
        <MetricCard
          title="Total Incidents"
          value={incidents}
          subtitle="Historical incident records"
        />

        <MetricCard
          title="AI Sessions"
          value={sessions}
          subtitle="Chat sessions created"
        />

        <MetricCard
          title="Intelligence Utilization"
          value={`${utilization}%`}
          subtitle="Sessions per incident"
        />

        <MetricCard
          title="Engagement Depth"
          value={engagement}
          subtitle="Avg messages per session"
        />

        <MetricCard
          title="AI Assist Ratio"
          value={`${aiAssistRatio}%`}
          subtitle="AI responses per message"
        />

        <MetricCard
          title="Incident Coverage"
          value={`${coverage}%`}
          subtitle="Incidents touched by AI"
        />
      </div>

      <div style={styles.healthCard}>
        <h3>Operational Health Insight</h3>
        <p>
          {incidents === 0
            ? "No incident data uploaded yet."
            : sessions === 0
            ? "AI is not being used. Consider training and promoting usage."
            : Number(utilization) < 10
            ? "Low AI adoption detected. Engineers are not leveraging intelligence consistently."
            : "AI adoption healthy. Intelligence is integrated into workflow."}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: any;
  subtitle: string;
}) {
  return (
    <div style={styles.card}>
      <h4 style={{ opacity: 0.7 }}>{title}</h4>
      <div style={styles.metricValue}>{value}</div>
      <p style={{ opacity: 0.6 }}>{subtitle}</p>
    </div>
  );
}

const styles: any = {
  wrapper: {
    padding: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "25px",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
  },
  metricValue: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "10px 0",
  },
  healthCard: {
    marginTop: "40px",
    background: "rgba(59,130,246,0.1)",
    padding: "25px",
    borderRadius: "16px",
  },
  loading: {
    padding: "40px",
  },
  error: {
    padding: "40px",
    color: "red",
  },
};