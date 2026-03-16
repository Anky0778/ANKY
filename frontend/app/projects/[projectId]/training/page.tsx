"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { streamTraining } from "app/services/training";
import { fetchProjectById } from "app/services/projects";

const STAGES = [
  { key: "validating",  label: "Validating uploaded data" },
  { key: "extracting",  label: "Extracting & normalizing text" },
  { key: "chunking",    label: "Chunking documents" },
  { key: "embedding",   label: "Generating embeddings" },
  { key: "indexing",    label: "Building FAISS vector index" },
  { key: "done",        label: "Finalizing intelligence layer" },
];

type StageStatus = "idle" | "active" | "done" | "error";

export default function TrainingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stageStatuses, setStageStatuses] = useState<Record<string, StageStatus>>(
    Object.fromEntries(STAGES.map((s) => [s.key, "idle"]))
  );
  const [currentMessage, setCurrentMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  function resetStages() {
    setStageStatuses(Object.fromEntries(STAGES.map((s) => [s.key, "idle"])));
    setCurrentMessage("");
    setErrorMessage("");
  }

  async function handleTrain() {
    setIsRunning(true);
    resetStages();

    try {
      await streamTraining(projectId, (event) => {
        if (event.step === "error") {
          // Mark any active stage as error
          setStageStatuses((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
              if (next[key] === "active") next[key] = "error";
            }
            return next;
          });
          setErrorMessage(event.message);
          setIsRunning(false);
          return;
        }

        setCurrentMessage(event.message);

        setStageStatuses((prev) => {
          const next = { ...prev };
          // Mark all previous active as done
          for (const key of Object.keys(next)) {
            if (next[key] === "active") next[key] = "done";
          }
          // Mark current step
          if (event.step === "done") {
            // Mark all as done
            for (const key of Object.keys(next)) next[key] = "done";
          } else {
            next[event.step] = "active";
          }
          return next;
        });

        if (event.step === "done") {
          fetchProjectById(projectId).then(setProject);
          setIsRunning(false);
        }
      });
    } catch (e: any) {
      setErrorMessage(e.message || "Training failed.");
      setIsRunning(false);
    }
  }

  if (!project) return <div style={{ padding: "40px" }}>Loading...</div>;

  const alreadyTrained = project.is_trained;

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Intelligence Training</h2>
        <span
          style={{
            ...styles.statusBadge,
            background: alreadyTrained ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
            color: alreadyTrained ? "#22c55e" : "#facc15",
          }}
        >
          {alreadyTrained ? "Intelligence Ready" : "Training Required"}
        </span>
      </div>

      {/* Description */}
      <div style={styles.card}>
        <p style={{ opacity: 0.8, margin: 0 }}>
          ANKY converts uploaded documents and historical incidents into semantic
          embeddings and builds a high-speed FAISS vector index. This enables
          contextual retrieval, similarity matching, and AI-assisted resolution
          suggestions.
        </p>
      </div>

      {/* Pipeline */}
      <div style={styles.pipelineContainer}>
        {STAGES.map((stage) => {
          const status = stageStatuses[stage.key];
          return (
            <div key={stage.key} style={styles.stageRow}>
              {/* Indicator */}
              <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                <div
                  style={{
                    ...styles.stageIndicator,
                    background:
                      status === "active" ? "#3b82f6"
                      : status === "done"   ? "#22c55e"
                      : status === "error"  ? "#ef4444"
                      : "rgba(255,255,255,0.1)",
                    boxShadow: status === "active" ? "0 0 8px #3b82f6" : "none",
                  }}
                />
                {/* Spinner ring for active */}
                {status === "active" && (
                  <div style={styles.spinnerRing} />
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  opacity: status === "idle" ? 0.4 : 1,
                  fontWeight: status === "active" ? 600 : 400,
                  color:
                    status === "error" ? "#ef4444"
                    : status === "done"  ? "#22c55e"
                    : "inherit",
                  transition: "all 0.3s ease",
                }}
              >
                {stage.label}
              </span>

              {/* Checkmark / X */}
              {status === "done"  && <span style={{ marginLeft: "auto", color: "#22c55e" }}>✓</span>}
              {status === "error" && <span style={{ marginLeft: "auto", color: "#ef4444" }}>✗</span>}
            </div>
          );
        })}

        {/* Live message */}
        {currentMessage && !errorMessage && (
          <div style={styles.liveMessage}>
            {isRunning && <span style={styles.pulse}>●</span>} {currentMessage}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.actionContainer}>
        <button
          onClick={handleTrain}
          disabled={isRunning}
          style={{ ...styles.primaryButton, opacity: isRunning ? 0.6 : 1 }}
        >
          {isRunning
            ? "Training in progress..."
            : alreadyTrained
            ? "Retrain Intelligence"
            : "Start Training"}
        </button>

        {errorMessage && (
          <div style={styles.errorBox}>
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const styles: any = {
  wrapper:            { padding: "40px", maxWidth: "900px" },
  header:             { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  statusBadge:        { padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  card:               { background: "rgba(255,255,255,0.05)", padding: "25px", borderRadius: "16px", marginBottom: "30px" },
  pipelineContainer:  { background: "rgba(255,255,255,0.04)", padding: "25px", borderRadius: "16px", marginBottom: "30px" },
  stageRow:           { display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" },
  stageIndicator:     { width: "14px", height: "14px", borderRadius: "50%", transition: "all 0.3s ease" },
  spinnerRing:        {
    position: "absolute", top: -2, left: -2,
    width: "18px", height: "18px", borderRadius: "50%",
    border: "2px solid transparent",
    borderTopColor: "#3b82f6",
    animation: "spin 0.8s linear infinite",
  },
  liveMessage:        { marginTop: "12px", fontSize: "13px", opacity: 0.7, display: "flex", alignItems: "center", gap: "8px" },
  pulse:              { color: "#3b82f6", animation: "pulse 1.2s ease infinite" },
  actionContainer:    { display: "flex", flexDirection: "column", gap: "15px" },
  primaryButton:      {
    background: "linear-gradient(90deg,#3b82f6,#2563eb)",
    border: "none", padding: "14px 20px",
    borderRadius: "10px", color: "white",
    fontWeight: 600, cursor: "pointer", fontSize: "15px",
  },
  errorBox:           { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "15px", borderRadius: "12px", color: "#ef4444" },
};