"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  LogOut,
  LayoutGrid,
  Bot,
  Zap,
  TrendingUp,
  Settings2,
  FileText,
  Target,
  FolderOpen,
  MessageSquare,
  BarChart3,
  Trash2,
  Inbox,
  Check,
} from "lucide-react";
import { fetchProjects, createProject, deleteProject } from "app/services/projects";
import { useAuth } from "app/hooks/useAuth";

const APP_TYPES = [
  "Web Application",
  "Mobile App",
  "Enterprise System",
  "SaaS Platform",
  "Microservices",
  "Legacy System",
];
const ENVIRONMENTS = ["Production", "Staging", "Development", "Internal"];

export default function Dashboard() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    appType: "",
    environment: "",
    userBase: "",
    incidentVolume: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingProjects(true);
    fetchProjects()
      .then((data) => setProjects(data))
      .catch(() => setError("Failed to load workspaces"))
      .finally(() => setIsLoadingProjects(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  if (isLoading || !isAuthenticated) return null;

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      const project = await createProject(form.name, form.description);
      setProjects((prev) => [...prev, project]);
      setIsCreateOpen(false);
      setForm({ name: "", description: "", appType: "", environment: "", userBase: "", incidentVolume: "" });
    } catch {
      setError("Workspace creation failed");
    }
  }

  async function handleDelete(projectId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this workspace? This cannot be undone.")) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      setError("Failed to delete workspace");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
      {/* TOP BAR */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          background: "var(--surface-0)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--radius-md)",
              background: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--fs-base)" }}>ANKY</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {projects.length > 0 && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New workspace
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <div className="page" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">Intelligence Workspaces</h1>
          <p className="page-subtitle">AI-powered incident resolution and knowledge management</p>
        </div>

        {/* LOADING STATE */}
        {isLoadingProjects && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ height: 190 }}>
                <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 14 }} />
                <div className="skeleton" style={{ height: 22, width: "70%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: "90%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 14, width: "60%" }} />
              </div>
            ))}
          </div>
        )}

        {!isLoadingProjects && (
          <>
            {/* STATS BAR */}
            {projects.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                <StatCard icon={<LayoutGrid size={17} />} value={projects.length} label="Active workspaces" />
                <StatCard
                  icon={<Bot size={17} />}
                  value={projects.filter((p) => p.is_trained).length}
                  label="Intelligence ready"
                />
                <StatCard icon={<Zap size={17} />} value="~10s" label="Query response" />
                <StatCard icon={<TrendingUp size={17} />} value="100%" label="RAG-powered search" />
              </div>
            )}

            {/* EMPTY STATE */}
            {projects.length === 0 && (
              <div className="card" style={{ padding: "56px 40px", textAlign: "center", maxWidth: 780, margin: "24px auto" }}>
                <div className="state-icon" style={{ margin: "0 auto 20px" }}>
                  <LayoutGrid size={22} />
                </div>
                <h2 style={{ fontSize: "var(--fs-xl)", fontWeight: 700, marginBottom: 10 }}>
                  Create your first intelligence workspace
                </h2>
                <p className="section-text" style={{ maxWidth: 520, margin: "0 auto 32px" }}>
                  ANKY learns from your incidents and documentation to reduce diagnosis time from hours to
                  seconds. Train your AI assistant with past incidents, technical docs, and resolution patterns.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    marginBottom: 28,
                    textAlign: "left",
                  }}
                >
                  <WorkflowStep n={1} icon={<Inbox size={16} />} title="Ingest data" desc="Upload incidents, docs, SNOW/Jira data" />
                  <WorkflowStep n={2} icon={<Bot size={16} />} title="Train intelligence" desc="AI learns patterns & root causes" />
                  <WorkflowStep n={3} icon={<Zap size={16} />} title="Resolve faster" desc="Get instant RCA & similar incidents" />
                  <WorkflowStep n={4} icon={<BarChart3 size={16} />} title="Analyze trends" desc="Track patterns & improve SLA" />
                </div>

                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
                  {["Reduce MTTR by 80%", "Eliminate knowledge loss", "24/7 intelligent support"].map((b) => (
                    <span key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                      <Check size={14} color="var(--success)" /> {b}
                    </span>
                  ))}
                </div>

                <button className="btn btn-primary btn-lg" onClick={() => setIsCreateOpen(true)}>
                  <Plus size={16} /> Create your first workspace
                </button>
              </div>
            )}

            {/* WORKSPACE GRID */}
            {projects.length > 0 && (
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>
                  Your workspaces
                </h2>
                <p className="section-text" style={{ marginBottom: 18 }}>
                  Manage your AI-powered incident resolution environments
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {projects.map((p) => (
                    <div key={p.id} className="card card-interactive">
                      <div className="card-header">
                        <div className="state-icon" style={{ width: 38, height: 38, margin: 0 }}>
                          {p.is_trained ? <Bot size={18} /> : <Settings2 size={18} />}
                        </div>
                        <span className={`badge ${p.is_trained ? "badge-success" : "badge-warning"}`}>
                          {p.is_trained ? "Intelligence ready" : "Training required"}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "var(--fs-md)", fontWeight: 600, marginBottom: 6 }}>{p.name}</h3>
                      <p className="section-text truncate" style={{ marginBottom: 18, WebkitLineClamp: 2 }}>
                        {p.description || "No description provided"}
                      </p>

                      <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                          <FileText size={13} /> Documents trained
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                          <Target size={13} /> Incidents analyzed
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link href={`/projects/${p.id}`} className="btn btn-secondary" style={{ flex: 1, textDecoration: "none" }}>
                          <FolderOpen size={15} /> Open workspace
                        </Link>
                        <Link href={`/projects/${p.id}/chat`} className="btn btn-ghost btn-icon" title="Chat">
                          <MessageSquare size={16} />
                        </Link>
                        <Link href={`/projects/${p.id}/analytics`} className="btn btn-ghost btn-icon" title="Analytics">
                          <BarChart3 size={16} />
                        </Link>
                        <button onClick={(e) => handleDelete(p.id, e)} className="btn btn-ghost btn-icon" title="Delete workspace">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div
          onClick={() => setIsCreateOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 8, 12, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card animate-fade-in"
            style={{ width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, marginBottom: 4 }}>
                Create intelligence workspace
              </h2>
              <p className="section-text">Set up a new AI-powered incident resolution environment</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Workspace name *</label>
                <input
                  className="input"
                  placeholder="e.g., Production Support Q1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Brief description of this workspace's purpose"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Application type</label>
                  <select
                    className="select"
                    value={form.appType}
                    onChange={(e) => setForm({ ...form, appType: e.target.value })}
                  >
                    <option value="">Select type</option>
                    {APP_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Environment</label>
                  <select
                    className="select"
                    value={form.environment}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                  >
                    <option value="">Select environment</option>
                    {ENVIRONMENTS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Total user base</label>
                  <input
                    className="input"
                    placeholder="e.g., 50,000 users"
                    value={form.userBase}
                    onChange={(e) => setForm({ ...form, userBase: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Monthly incidents</label>
                  <input
                    className="input"
                    placeholder="e.g., 200 incidents/month"
                    value={form.incidentVolume}
                    onChange={(e) => setForm({ ...form, incidentVolume: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={!form.name.trim()}>
                Create workspace
              </button>
              <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR TOAST */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--surface-2)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            zIndex: 200,
            fontSize: "var(--fs-sm)",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="metric-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div className="state-icon" style={{ width: 38, height: 38, margin: 0, color: "var(--brand)" }}>
        {icon}
      </div>
      <div>
        <div className="metric-value" style={{ marginTop: 0, fontSize: "var(--fs-xl)" }}>
          {value}
        </div>
        <div className="metric-label" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--brand)" }}>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-tertiary)" }}>{n}</span>
        {icon}
      </div>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{desc}</div>
    </div>
  );
}
