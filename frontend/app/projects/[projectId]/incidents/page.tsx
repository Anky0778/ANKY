"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { uploadIncidents } from "app/services/incidents";
import { fetchProjectById } from "app/services/projects";

export default function IncidentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const inputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  async function handleUpload() {
    if (!file) {
      setStatus({ type: "error", text: "Please select an incident file." });
      return;
    }
    try {
      setIsUploading(true);
      setStatus(null);
      await uploadIncidents(projectId, file);
      setStatus({ type: "success", text: "Incidents uploaded successfully." });
      setFile(null);
    } catch (e: any) {
      setStatus({ type: "error", text: e.response?.data?.detail || "Upload failed. Please try again." });
    } finally {
      setIsUploading(false);
    }
  }

  if (!project) {
    return (
      <div className="page" style={{ maxWidth: 780, margin: "0 auto" }}>
        <div className="skeleton" style={{ height: 24, width: 260, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const alreadyTrained = project.is_trained;

  return (
    <div className="page" style={{ maxWidth: 780, margin: "0 auto" }}>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Historical incident data</h1>
      <p className="page-subtitle" style={{ marginBottom: 20 }}>
        Import past incidents so ANKY can learn resolution patterns and root causes.
      </p>

      <div
        className={`badge ${alreadyTrained ? "badge-warning" : "badge-info"}`}
        style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", marginBottom: 20, borderRadius: "var(--radius-md)" }}
      >
        <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontWeight: 500 }}>
          {alreadyTrained
            ? "Intelligence is already trained. Uploading new incident data will require retraining."
            : "Upload historical incidents before running intelligence training."}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Expected file format</div>
        <ul className="section-text" style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>CSV or XLSX file recommended</li>
          <li>Columns: Number, Description, Long Description, Root Cause, Resolution Notes</li>
          <li>UTF-8 encoding</li>
        </ul>
      </div>

      <div className="card">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) { setFile(e.dataTransfer.files[0]); setStatus(null); }
          }}
          style={{
            border: `2px dashed ${isDragging ? "var(--brand)" : "var(--border-default)"}`,
            background: isDragging ? "var(--brand-subtle)" : "var(--surface-1)",
            borderRadius: "var(--radius-lg)",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 20,
            transition: "border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease)",
          }}
        >
          <div className="state-icon" style={{ margin: "0 auto 14px", color: "var(--brand)" }}>
            <UploadCloud size={22} />
          </div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Upload incident file</p>
          <span className="text-faint" style={{ fontSize: "var(--fs-sm)" }}>CSV or XLSX · click or drag to browse</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            style={{ display: "none" }}
            onChange={(e) => { setFile(e.target.files?.[0] || null); setStatus(null); }}
          />
        </div>

        {file && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              marginBottom: 20,
            }}
          >
            <FileSpreadsheet size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <span className="truncate" style={{ flex: 1, fontSize: "var(--fs-sm)" }}>{file.name}</span>
            <button onClick={() => setFile(null)} className="btn btn-ghost btn-icon" style={{ height: 26, width: 26 }} title="Remove">
              <X size={14} />
            </button>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? (
            <>
              <span className="spinner" /> Uploading…
            </>
          ) : (
            <>
              <UploadCloud size={16} /> Upload incidents
            </>
          )}
        </button>

        {status && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: status.type === "success" ? "var(--success-subtle)" : "var(--danger-subtle)",
              color: status.type === "success" ? "var(--success)" : "var(--danger)",
              fontSize: "var(--fs-sm)",
              fontWeight: 500,
            }}
          >
            {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
}
