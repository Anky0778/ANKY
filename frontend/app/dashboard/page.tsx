"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProjects, createProject, deleteProject } from "app/services/projects";
import { useAuth } from "app/hooks/useAuth";

export default function Dashboard() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  // Add global styles for select dropdowns
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      select option {
        background-color: #1e293b !important;
        color: white !important;
        padding: 10px;
      }
      select option:checked {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      select option:hover {
        background-color: #334155 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    appType: "",
    environment: "",
    userBase: "",
    incidentVolume: "",
  });

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  useEffect(() => {
  if (!isAuthenticated) return;
  setIsLoadingProjects(true);
  fetchProjects()
    .then((data) => setProjects(data))
    .catch(() => setError("Failed to load workspaces"))
    .finally(() => setIsLoadingProjects(false));
}, [isAuthenticated]);
  if (isLoading || isLoadingProjects) return null; // ✅ return null during SSR, not JSX
if (!isAuthenticated) return null;
if (isLoadingProjects) return (  // ✅ show spinner while fetching projects
  <div style={{
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "18px",
    gap: "12px",
  }}>
    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
    Loading workspaces...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

  async function handleCreate() {
    if (!form.name.trim()) return;

    try {
      const project = await createProject(form.name, form.description);
      setProjects((prev) => [...prev, project]);
      setIsCreateOpen(false);
      setForm({
        name: "",
        description: "",
        appType: "",
        environment: "",
        userBase: "",
        incidentVolume: "",
      });
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
    <div style={styles.wrapper}>
      {/* Animated Background Elements */}
      <div style={styles.bgGradient1}></div>
      <div style={styles.bgGradient2}></div>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Intelligence Workspaces</h1>
          <p style={styles.subtitle}>
            AI-powered incident resolution and knowledge management
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {projects.length > 0 && (
            <button style={styles.primaryBtn} onClick={() => setIsCreateOpen(true)}>
              <span style={styles.btnIcon}>+</span> New Workspace
            </button>
          )}
          <button style={styles.secondaryBtn} onClick={() => {
            logout();
            window.location.href = "/";
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* STATS BAR - Only show when there are projects */}
      {projects.length > 0 && (
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <div style={styles.statValue}>{projects.length}</div>
              <div style={styles.statLabel}>Active Workspaces</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🤖</div>
            <div>
              <div style={styles.statValue}>
                {projects.filter(p => p.is_trained).length}
              </div>
              <div style={styles.statLabel}>Intelligence Ready</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⚡</div>
            <div>
              <div style={styles.statValue}>~60s</div>
              <div style={styles.statLabel}>Avg Resolution Time</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>
            <div>
              <div style={styles.statValue}>85%</div>
              <div style={styles.statLabel}>Accuracy Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {projects.length === 0 && (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🚀</div>
            
            <h2 style={styles.emptyTitle}>
              Create Your First Intelligence Workspace
            </h2>
            
            <p style={styles.emptyDescription}>
              ANKY learns from your incidents and documentation to reduce diagnosis
              time from hours to seconds. Train your AI assistant with past incidents,
              technical docs, and resolution patterns.
            </p>

            <div style={styles.workflow}>
              <div style={styles.workflowStep}>
                <div style={styles.workflowNumber}>1</div>
                <div style={styles.workflowIcon}>📥</div>
                <div style={styles.workflowTitle}>Ingest Data</div>
                <div style={styles.workflowDesc}>
                  Upload incidents, docs, SNOW/Jira data
                </div>
              </div>
              
              <div style={styles.workflowArrow}>→</div>
              
              <div style={styles.workflowStep}>
                <div style={styles.workflowNumber}>2</div>
                <div style={styles.workflowIcon}>🧠</div>
                <div style={styles.workflowTitle}>Train Intelligence</div>
                <div style={styles.workflowDesc}>
                  AI learns patterns & root causes
                </div>
              </div>
              
              <div style={styles.workflowArrow}>→</div>
              
              <div style={styles.workflowStep}>
                <div style={styles.workflowNumber}>3</div>
                <div style={styles.workflowIcon}>⚡</div>
                <div style={styles.workflowTitle}>Resolve Faster</div>
                <div style={styles.workflowDesc}>
                  Get instant RCA & similar incidents
                </div>
              </div>
              
              <div style={styles.workflowArrow}>→</div>
              
              <div style={styles.workflowStep}>
                <div style={styles.workflowNumber}>4</div>
                <div style={styles.workflowIcon}>📊</div>
                <div style={styles.workflowTitle}>Analyze Trends</div>
                <div style={styles.workflowDesc}>
                  Track patterns & improve SLA
                </div>
              </div>
            </div>

            <div style={styles.benefits}>
              <div style={styles.benefit}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Reduce MTTR by 80%</span>
              </div>
              <div style={styles.benefit}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Eliminate knowledge loss</span>
              </div>
              <div style={styles.benefit}>
                <span style={styles.benefitIcon}>✓</span>
                <span>24/7 intelligent support</span>
              </div>
            </div>

            <button style={styles.ctaButton} onClick={() => setIsCreateOpen(true)}>
              Create Your First Workspace
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE GRID */}
      {projects.length > 0 && (
        <div style={styles.workspacesSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Workspaces</h2>
            <p style={styles.sectionSubtitle}>
              Manage your AI-powered incident resolution environments
            </p>
          </div>
          
          <div style={styles.grid}>
            {projects.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    {p.is_trained ? "🤖" : "⚙️"}
                  </div>
                  
                  <div style={{
                    ...styles.statusBadge,
                    background: p.is_trained 
                      ? "rgba(34, 197, 94, 0.15)" 
                      : "rgba(234, 179, 8, 0.15)",
                    color: p.is_trained ? "#22c55e" : "#eab308"
                  }}>
                    {p.is_trained ? "Intelligence Ready" : "Training Required"}
                  </div>
                </div>

                <h3 style={styles.cardTitle}>{p.name}</h3>
                
                <p style={styles.cardDescription}>
                  {p.description || "No description provided"}
                </p>

                <div style={styles.cardStats}>
                  <div style={styles.cardStat}>
                    <span style={styles.cardStatIcon}>📄</span>
                    <span style={styles.cardStatText}>Documents trained</span>
                  </div>
                  <div style={styles.cardStat}>
                    <span style={styles.cardStatIcon}>🎯</span>
                    <span style={styles.cardStatText}>Incidents analyzed</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <Link href={`/projects/${p.id}`} style={styles.cardActionPrimary}>
                    <span style={styles.actionIcon}>📂</span>
                    Open Workspace
                  </Link>
                  
                  <div style={styles.cardActionSecondary}>
                    <Link href={`/projects/${p.id}/chat`} style={styles.iconLink}>
                      <span title="Chat">💬</span>
                    </Link>
                    <Link href={`/projects/${p.id}/analytics`} style={styles.iconLink}>
                      <span title="Analytics">📊</span>
                    </Link>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      style={styles.deleteBtn}
                      title="Delete workspace"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Intelligence Workspace</h2>
              <p style={styles.modalSubtitle}>
                Set up a new AI-powered incident resolution environment
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Workspace Name *</label>
              <input
                style={styles.input}
                placeholder="e.g., Production Support Q1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={{...styles.input, ...styles.textarea}}
                placeholder="Brief description of this workspace's purpose"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Application Type</label>
                <select
                  style={styles.select}
                  value={form.appType}
                  onChange={(e) => setForm({ ...form, appType: e.target.value })}
                >
                  <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Select type</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Web Application</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Mobile App</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Enterprise System</option>
                  <option style={{ background: "#1e293b", color: "white" }}>SaaS Platform</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Microservices</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Legacy System</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Environment</label>
                <select
                  style={styles.select}
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value })}
                >
                  <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Select environment</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Production</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Staging</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Development</option>
                  <option style={{ background: "#1e293b", color: "white" }}>Internal</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Total User Base</label>
                <input
                  style={styles.input}
                  placeholder="e.g., 50,000 users"
                  value={form.userBase}
                  onChange={(e) => setForm({ ...form, userBase: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Monthly Incidents</label>
                <input
                  style={styles.input}
                  placeholder="e.g., 200 incidents/month"
                  value={form.incidentVolume}
                  onChange={(e) => setForm({ ...form, incidentVolume: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button 
                style={styles.modalPrimaryBtn} 
                onClick={handleCreate}
                disabled={!form.name.trim()}
              >
                Create Workspace
              </button>
              <button 
                style={styles.modalSecondaryBtn} 
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div style={styles.errorToast}>
          {error}
        </div>
      )}
    </div>
  );
}

const styles: any = {
  wrapper: {
  minHeight: "100vh",
  maxHeight: "100vh",        /* ✅ ADD — contains it to viewport */
  overflowY: "auto",         /* ✅ dashboard scrolls internally */
  overflowX: "hidden",       /* ✅ no horizontal overflow */
  padding: "40px 60px",
  background: "#0f172a",
  color: "white",
  position: "relative",
},

  bgGradient1: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgGradient2: {
    position: "absolute",
    bottom: "-30%",
    left: "-15%",
    width: "700px",
    height: "700px",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "8px",
    background: "linear-gradient(135deg, #fff 0%, #e2e8f0 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "16px",
    color: "#94a3b8",
    fontWeight: "400",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  btnIcon: {
    fontSize: "18px",
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    padding: "12px 24px",
    borderRadius: "10px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  statsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "40px",
    position: "relative",
    zIndex: 1,
  },
  statCard: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.3s ease",
  },
  statIcon: {
    fontSize: "32px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  emptyContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    position: "relative",
    zIndex: 1,
  },
  emptyCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "60px",
    borderRadius: "24px",
    maxWidth: "1100px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "24px",
  },
  emptyTitle: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#fff",
  },
  emptyDescription: {
    fontSize: "16px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    marginBottom: "48px",
    maxWidth: "700px",
    margin: "0 auto 48px",
  },
  workflow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginBottom: "48px",
  },
  workflowStep: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px 20px",
    width: "180px",
    position: "relative",
  },
  workflowNumber: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.2)",
    color: "#3b82f6",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workflowIcon: {
    fontSize: "36px",
    marginBottom: "12px",
  },
  workflowTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "8px",
  },
  workflowDesc: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.4",
  },
  workflowArrow: {
    fontSize: "24px",
    color: "#475569",
    fontWeight: "300",
  },
  benefits: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "40px",
  },
  benefit: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
    color: "#e2e8f0",
  },
  benefitIcon: {
    color: "#22c55e",
    fontSize: "18px",
    fontWeight: "700",
  },
  ctaButton: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "16px 48px",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "600",
    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4)",
    transition: "all 0.3s ease",
  },
  workspacesSection: {
    position: "relative",
    zIndex: 1,
  },
  sectionHeader: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: "15px",
    color: "#94a3b8",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "28px",
    borderRadius: "20px",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardIcon: {
    fontSize: "40px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid currentColor",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "12px",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "24px",
    minHeight: "40px",
  },
  cardStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
    padding: "16px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  cardStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#cbd5e1",
  },
  cardStatIcon: {
    fontSize: "16px",
  },
  cardStatText: {
    flex: 1,
  },
  cardActions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "auto",
  },
  cardActionPrimary: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    padding: "14px 20px",
    borderRadius: "10px",
    textDecoration: "none",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  actionIcon: {
    fontSize: "18px",
  },
  cardActionSecondary: {
    display: "flex",
    gap: "12px",
  },
  iconLink: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    padding: "12px",
    borderRadius: "10px",
    textDecoration: "none",
    textAlign: "center",
    fontSize: "20px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "40px",
    borderRadius: "24px",
    width: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  modalHeader: {
    marginBottom: "32px",
  },
  modalTitle: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#fff",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  formGroup: {
    marginBottom: "24px",
    width: "100%",
  },
  formRow: {
    display: "flex",
    gap: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "white",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    // Fix for select dropdowns
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
  },
  select: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "white",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    cursor: "pointer",
    // Custom arrow
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: "40px",
  },
  textarea: {
    minHeight: "100px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
  },
  modalPrimaryBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "14px 24px",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  modalSecondaryBtn: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "14px 24px",
    borderRadius: "10px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  errorToast: {
    position: "fixed",
    bottom: "32px",
    right: "32px",
    background: "#ef4444",
    color: "white",
    padding: "16px 24px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)",
    zIndex: 2000,
  },
  deleteBtn: {
  flex: 1,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
  color: "#ef4444",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
},

};

