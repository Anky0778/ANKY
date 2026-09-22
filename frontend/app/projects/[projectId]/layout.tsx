"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  BrainCircuit,
  MessageSquare,
  BarChart3,
  ChevronsLeft,
  CircleDot,
  Boxes,
} from "lucide-react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [projectName, setProjectName] = useState("Loading…");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Mock: replace with real project fetch
    setProjectName("Production Workspace");
  }, [projectId]);

  const navItems = [
    { label: "Overview", href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
    { label: "Documents", href: `/projects/${projectId}/documents`, icon: FileText },
    { label: "Incidents", href: `/projects/${projectId}/incidents`, icon: AlertTriangle },
    { label: "Training", href: `/projects/${projectId}/training`, icon: BrainCircuit },
    { label: "Chat", href: `/projects/${projectId}/chat`, icon: MessageSquare },
    { label: "Analytics", href: `/projects/${projectId}/analytics`, icon: BarChart3 },
  ];

  const isActive = (item: (typeof navItems)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div style={styles.wrapper}>
      <aside
        style={{
          ...styles.sidebar,
          width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        }}
      >
        <button
          style={styles.backButton}
          onClick={() => router.push("/dashboard")}
          title="Back to dashboard"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <div style={styles.projectInfo}>
          <div style={styles.projectIcon}>
            <Boxes size={18} strokeWidth={2} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={styles.projectLabel}>Workspace</div>
              <div style={styles.projectName} className="truncate">
                {projectName}
              </div>
            </div>
          )}
        </div>

        <hr className="divider" style={{ marginBottom: 16 }} />

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  ...styles.navItem,
                  background: active ? "var(--brand-subtle)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--surface-3)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    ...styles.activeBar,
                    background: active ? "var(--brand)" : "transparent",
                  }}
                />
                <Icon size={18} strokeWidth={2} color={active ? "var(--brand)" : "currentColor"} />
                {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button
            style={styles.collapseButton}
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft
              size={16}
              style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform var(--t-normal) var(--ease)" }}
            />
            {!collapsed && <span>Collapse</span>}
          </button>

          {!collapsed && (
            <div style={styles.statusCard}>
              <CircleDot size={13} color="var(--success)" />
              <span style={styles.statusText}>Intelligence active</span>
            </div>
          )}
        </div>
      </aside>

      <main style={styles.content}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    height: "100vh",
    background: "var(--surface-0)",
    color: "var(--text-primary)",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    padding: "20px 14px",
    borderRight: "1px solid var(--border-subtle)",
    background: "var(--surface-1)",
    transition: "width var(--t-normal) var(--ease)",
    flexShrink: 0,
    overflow: "hidden",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "9px 12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    fontWeight: 500,
    marginBottom: 18,
    width: "100%",
  },
  projectInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 2px",
    marginBottom: 16,
  },
  projectIcon: {
    width: 34,
    height: 34,
    borderRadius: "var(--radius-md)",
    background: "var(--surface-3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--brand)",
    flexShrink: 0,
  },
  projectLabel: {
    fontSize: "var(--fs-xs)",
    color: "var(--text-tertiary)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  projectName: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 10px",
    borderRadius: "var(--radius-md)",
    textDecoration: "none",
    fontSize: "var(--fs-sm)",
    fontWeight: 500,
    position: "relative",
    transition: "background var(--t-fast) var(--ease), color var(--t-fast) var(--ease)",
  },
  activeBar: {
    position: "absolute",
    left: -14,
    top: "20%",
    height: "60%",
    width: 3,
    borderRadius: "0 3px 3px 0",
  },
  navLabel: { whiteSpace: "nowrap" },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: 14,
    borderTop: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  collapseButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "transparent",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "9px 12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    fontWeight: 500,
    width: "100%",
  },
  statusCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: "var(--radius-md)",
    background: "var(--success-subtle)",
  },
  statusText: {
    fontSize: "var(--fs-xs)",
    color: "var(--success)",
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
  },
};
