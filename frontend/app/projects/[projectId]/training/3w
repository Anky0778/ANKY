"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { trainProject } from "app/services/training";
import { fetchProjectById } from "app/services/projects";

export default function TrainingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const stages = [
    "Validating uploaded data",
    "Extracting & normalizing text",
    "Chunking documents",
    "Generating embeddings",
    "Building FAISS vector index",
    "Finalizing intelligence layer",
  ];

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  async function handleTrain() {
  try {
    setIsRunning(true);
    setMessage("");
    setStageIndex(null);

    // Step 1: Call backend first (real validation)
    await trainProject(projectId);

    // Step 2: If backend succeeds, show visual progression
    for (let i = 0; i < stages.length; i++) {
      setStageIndex(i);
      await new Promise((res) => setTimeout(res, 500));
    }

    const updated = await fetchProjectById(projectId);
    setProject(updated);

    setMessage("Intelligence training completed successfully.");
    setIsRunning(false);
    setStageIndex(null);

  } catch (e: any) {
    // Stop immediately if validation fails
    setStageIndex(null);
    setMessage(e.response?.data?.detail || "Training failed.");
    setIsRunning(false);
  }
}

  if (!project) return <div style={{ padding: "40px" }}>Loading...</div>;

  const alreadyTrained = project.is_trained;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>Intelligence Training</h2>
        <span
          style={{
            ...styles.statusBadge,
            background: alreadyTrained
              ? "rgba(34,197,94,0.15)"
              : "rgba(234,179,8,0.15)",
            color: alreadyTrained ? "#22c55e" : "#facc15",
          }}
        >
          {alreadyTrained ? "Intelligence Ready" : "Training Required"}
        </span>
      </div>

      {/* Description Card */}
      <div style={styles.card}>
        <p style={{ opacity: 0.8 }}>
          ANKY converts uploaded documents and historical incidents into
          semantic embeddings and builds a high-speed FAISS vector index.
          This enables contextual retrieval, similarity matching, and
          AI-assisted resolution suggestions.
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div style={styles.pipelineContainer}>
        {stages.map((stage, index) => (
          <div key={index} style={styles.stageRow}>
            <div
              style={{
                ...styles.stageIndicator,
                background:
                  stageIndex === index
                    ? "#3b82f6"
                    : stageIndex !== null && stageIndex > index
                    ? "#22c55e"
                    : "rgba(255,255,255,0.1)",
              }}
            />
            <span
              style={{
                opacity:
                  stageIndex === index
                    ? 1
                    : stageIndex !== null && stageIndex > index
                    ? 0.9
                    : 0.5,
              }}
            >
              {stage}
            </span>
          </div>
        ))}
      </div>

      {/* Action Section */}
      <div style={styles.actionContainer}>
        <button
          onClick={handleTrain}
          disabled={isRunning}
          style={{
            ...styles.primaryButton,
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {alreadyTrained ? "Retrain Intelligence" : "Start Training"}
        </button>

        {message && (
          <div style={styles.messageBox}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  wrapper: {
    padding: "40px",
    maxWidth: "900px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "25px",
    borderRadius: "16px",
    marginBottom: "30px",
  },
  pipelineContainer: {
    background: "rgba(255,255,255,0.04)",
    padding: "25px",
    borderRadius: "16px",
    marginBottom: "30px",
  },
  stageRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "15px",
  },
  stageIndicator: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  },
  actionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  primaryButton: {
    background: "linear-gradient(90deg,#3b82f6,#2563eb)",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  messageBox: {
    background: "rgba(59,130,246,0.1)",
    padding: "15px",
    borderRadius: "12px",
  },
};