"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, X, AlertCircle, Zap, Circle } from "lucide-react";
import { streamTraining } from "app/services/training";
import { fetchProjectById } from "app/services/projects";

const STAGES = [
  { key: "validating", label: "Validating uploaded data" },
  { key: "extracting", label: "Extracting & normalizing text" },
  { key: "chunking", label: "Chunking documents" },
  { key: "embedding", label: "Generating embeddings" },
  { key: "indexing", label: "Building vector index" },
  { key: "done", label: "Finalizing intelligence layer" },
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
          for (const key of Object.keys(next)) {
            if (next[key] === "active") next[key] = "done";
          }
          if (event.step === "done") {
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

  if (!project) {
    return (
      <div className="page" style={{ maxWidth: 780, margin: "0 auto" }}>
        <div className="skeleton" style={{ height: 24, width: 220, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 280, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const alreadyTrained = project.is_trained;

  return (
    <div className="page" style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title">Intelligence training</h1>
        <span className={`badge ${alreadyTrained ? "badge-success" : "badge-warning"}`}>
          {alreadyTrained ? "Intelligence ready" : "Training required"}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-text">
          ANKY converts uploaded documents and historical incidents into semantic embeddings and builds a
          high-speed vector index. This enables contextual retrieval, similarity matching, and AI-assisted
          resolution suggestions.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {STAGES.map((stage) => {
            const status = stageStatuses[stage.key];
            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {status === "active" && (
                    <span className="spinner" style={{ width: 18, height: 18, borderTopColor: "var(--brand)", borderColor: "rgba(79,124,255,0.25)" }} />
                  )}
                  {status === "done" && <Check size={16} color="var(--success)" />}
                  {status === "error" && <X size={16} color="var(--danger)" />}
                  {status === "idle" && <Circle size={8} color="var(--text-disabled)" fill="var(--text-disabled)" />}
                </div>
                <span
                  style={{
                    fontSize: "var(--fs-sm)",
                    fontWeight: status === "active" ? 600 : 400,
                    color:
                      status === "error" ? "var(--danger)" :
                      status === "done" ? "var(--text-primary)" :
                      status === "idle" ? "var(--text-tertiary)" : "var(--text-primary)",
                  }}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {currentMessage && !errorMessage && (
          <div className="divider" style={{ margin: "16px 0" }} />
        )}
        {currentMessage && !errorMessage && (
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
            {isRunning && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />}
            {currentMessage}
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-block" onClick={handleTrain} disabled={isRunning}>
        {isRunning ? (
          <>
            <span className="spinner" /> Training in progress…
          </>
        ) : (
          <>
            <Zap size={16} /> {alreadyTrained ? "Retrain intelligence" : "Start training"}
          </>
        )}
      </button>

      {errorMessage && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--danger-subtle)",
            border: "1px solid rgba(229, 88, 79, 0.25)",
            color: "var(--danger)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}
    </div>
  );
}
