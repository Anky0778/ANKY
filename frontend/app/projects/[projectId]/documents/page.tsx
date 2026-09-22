"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { uploadDocuments } from "app/services/documents";
import { fetchProjectById } from "app/services/projects";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const inputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchProjectById(projectId).then(setProject);
  }, [projectId]);

  function addFiles(newFiles: FileList | File[]) {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    setStatus(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) {
      setStatus({ type: "error", text: "Select at least one document to upload." });
      return;
    }
    try {
      setIsUploading(true);
      setStatus(null);
      await uploadDocuments(projectId, files);
      setStatus({ type: "success", text: `${files.length} document${files.length !== 1 ? "s" : ""} uploaded successfully.` });
      setFiles([]);
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
      <h1 className="page-title" style={{ marginBottom: 4 }}>Knowledge documents</h1>
      <p className="page-subtitle" style={{ marginBottom: 20 }}>
        Upload SOPs, runbooks, and knowledge base files to train the AI assistant.
      </p>

      <div
        className={`badge ${alreadyTrained ? "badge-warning" : "badge-info"}`}
        style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", marginBottom: 20, borderRadius: "var(--radius-md)" }}
      >
        <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontWeight: 500 }}>
          {alreadyTrained
            ? "Intelligence is already trained. Uploading new documents will require retraining."
            : "Upload SOPs, KT documents, and knowledge base files before training."}
        </span>
      </div>

      <div className="card">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          style={{
            border: `2px dashed ${isDragging ? "var(--brand)" : "var(--border-default)"}`,
            background: isDragging ? "var(--brand-subtle)" : "var(--surface-1)",
            borderRadius: "var(--radius-lg)",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: files.length > 0 ? 20 : 24,
            transition: "border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease)",
          }}
        >
          <div className="state-icon" style={{ margin: "0 auto 14px", color: "var(--brand)" }}>
            <UploadCloud size={22} />
          </div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop documents here</p>
          <span className="text-faint" style={{ fontSize: "var(--fs-sm)" }}>or click to browse files</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="metric-label" style={{ marginBottom: 10 }}>
              Selected files ({files.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <FileText size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <span className="truncate" style={{ flex: 1, fontSize: "var(--fs-sm)" }}>{file.name}</span>
                  <span className="text-faint" style={{ fontSize: "var(--fs-xs)", flexShrink: 0 }}>{formatSize(file.size)}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="btn btn-ghost btn-icon"
                    style={{ height: 26, width: 26 }}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={handleUpload} disabled={isUploading || files.length === 0}>
          {isUploading ? (
            <>
              <span className="spinner" /> Uploading…
            </>
          ) : (
            <>
              <UploadCloud size={16} /> Upload documents
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
