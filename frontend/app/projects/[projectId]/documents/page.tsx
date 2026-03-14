"use client";

import { useState, useEffect } from "react";
import { uploadDocuments } from "app/services/documents";
import { fetchProjectById } from "app/services/projects";
import { useParams } from "next/navigation";

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  async function handleUpload() {
    if (files.length === 0) {
      setStatus("Select at least one document.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("");

      await uploadDocuments(projectId, files);

      setStatus("Documents uploaded successfully.");
      setFiles([]);
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
      <h2>SOP & Knowledge Documents</h2>

      {/* STATUS BANNER */}
      <div
        style={{
          ...styles.banner,
          background: alreadyTrained
            ? "rgba(34,197,94,0.15)"
            : "rgba(234,179,8,0.15)",
        }}
      >
        {alreadyTrained
          ? "Intelligence already trained. Uploading new documents requires retraining."
          : "Upload SOPs, KT documents, and knowledge base files before training."}
      </div>

      {/* UPLOAD CARD */}
      <div style={styles.card}>
        {/* MODERN DROP ZONE */}
        <div
          style={styles.dropZone}
          onClick={() => document.getElementById("docInput")?.click()}
        >
          <p style={{ marginBottom: "6px", fontWeight: 600 }}>
            Drag & drop documents here
          </p>
          <span style={{ opacity: 0.6, fontSize: "14px" }}>
            or click to browse files
          </span>

          <input
            id="docInput"
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) =>
              setFiles(Array.from(e.target.files || []))
            }
          />
        </div>

        {/* FILE PREVIEW */}
        {files.length > 0 && (
          <div style={styles.fileList}>
            <h4 style={{ marginBottom: "10px" }}>Selected Files</h4>
            {files.map((file, index) => (
              <div key={index} style={styles.fileItem}>
                {file.name}
              </div>
            ))}
          </div>
        )}

        {/* UPLOAD BUTTON */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          style={{
            ...styles.primaryButton,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? "Uploading..." : "Upload Documents"}
        </button>

        {/* STATUS MESSAGE */}
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
    marginBottom: "25px",
  },
  fileList: {
    marginBottom: "20px",
  },
  fileItem: {
    padding: "8px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "8px",
    marginBottom: "6px",
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