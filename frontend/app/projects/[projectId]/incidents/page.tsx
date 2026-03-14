"use client";

import { useState, useEffect } from "react";
import { uploadIncidents } from "app/services/incidents";
import { fetchProjectById } from "app/services/projects";
import { useParams } from "next/navigation";

export default function IncidentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  async function handleUpload() {
    if (!file) {
      setStatus("Please select an incident file.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("");

      await uploadIncidents(projectId, file);

      setStatus("Incidents uploaded successfully.");
      setFile(null);
      setIsUploading(false);

    } catch (e: any) {
      setStatus(e.response?.data?.detail || "Upload failed.");
      setIsUploading(false);
    }
  }

  if (!project) return <div style={{ padding: "40px" }}>Loading...</div>;

  const alreadyTrained = project.is_trained;

  return (
    <div style={styles.wrapper}>
      <h2>Historical Incident Data</h2>

      {/* TRAINING STATE BANNER */}
      <div
        style={{
          ...styles.banner,
          background: alreadyTrained
            ? "rgba(34,197,94,0.15)"
            : "rgba(234,179,8,0.15)",
        }}
      >
        {alreadyTrained
          ? "Intelligence already trained. Uploading new incident data requires retraining."
          : "Upload historical incidents before running intelligence training."}
      </div>

      {/* FORMAT GUIDANCE */}
      <div style={styles.infoCard}>
        <h4>Expected File Format</h4>
        <ul style={{ opacity: 0.8, fontSize: "14px" }}>
          <li>CSV/Xlsx file recommended</li>
          <li>Columns: Number,Description ,Long Description,RootCause,Resolution Notes
</li>
          <li>UTF-8 encoding</li>
        </ul>
      </div>

      {/* UPLOAD CARD */}
      <div style={styles.card}>
        <div
          style={styles.dropZone}
          onClick={() => document.getElementById("incidentInput")?.click()}
        >
          <p style={{ marginBottom: "6px", fontWeight: 600 }}>
            Upload Incident File (CSV)
          </p>
          <span style={{ opacity: 0.6, fontSize: "14px" }}>
            Click to browse
          </span>

          <input
            id="incidentInput"
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />
        </div>

        {file && (
          <div style={styles.fileItem}>
            Selected: {file.name}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading}
          style={{
            ...styles.primaryButton,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? "Uploading..." : "Upload Incidents"}
        </button>

        {status && (
          <div style={styles.statusBox}>
            {status}
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
  banner: {
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  infoCard: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "25px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRadius: "16px",
  },
  dropZone: {
    border: "2px dashed rgba(255,255,255,0.2)",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
    marginBottom: "20px",
  },
  fileItem: {
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
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
  statusBox: {
    marginTop: "15px",
    padding: "12px",
    background: "rgba(59,130,246,0.1)",
    borderRadius: "12px",
  },
};