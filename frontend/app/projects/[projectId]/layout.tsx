"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [projectName, setProjectName] = useState("Loading...");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mouse move effect for dynamic background - only on client
  useEffect(() => {
    if (!isClient) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isClient]);

  // Add global animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes glow {
        0%, 100% { opacity: 0.5; filter: blur(20px); }
        50% { opacity: 0.8; filter: blur(25px); }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes ripple {
        0% {
          transform: scale(0);
          opacity: 0.5;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      .glass-morphism {
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .nav-item {
        position: relative;
        overflow: hidden;
      }
      
      .nav-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .nav-item:hover::before {
        opacity: 1;
      }
      
      .nav-item::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(59, 130, 246, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        transition: transform 0.5s ease;
      }
      
      .nav-item:active::after {
        animation: ripple 0.5s ease-out;
      }
      
      .back-button:hover {
        transform: translateX(-2px);
        background: rgba(255,255,255,0.1) !important;
      }
      
      .collapse-button:hover {
        transform: rotate(180deg) scale(1.1);
      }
      
      .status-indicator {
        position: relative;
      }
      
      .status-indicator::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Mock: Fetch project name (replace with your actual API call)
  useEffect(() => {
    setProjectName("Production Workspace");
  }, [projectId]);

  const navItems = [
    { 
      label: "Overview", 
      href: `/projects/${projectId}`, 
      icon: "📊",
      description: "Dashboard & stats",
      color: "#3b82f6"
    },
    { 
      label: "Documents", 
      href: `/projects/${projectId}/documents`, 
      icon: "📄",
      description: "Knowledge base",
      color: "#8b5cf6"
    },
    { 
      label: "Incidents", 
      href: `/projects/${projectId}/incidents`, 
      icon: "🚨",
      description: "Issue tracking",
      color: "#ef4444"
    },
    { 
      label: "Training", 
      href: `/projects/${projectId}/training`, 
      icon: "🧠",
      description: "AI model training",
      color: "#10b981"
    },
    { 
      label: "Chat", 
      href: `/projects/${projectId}/chat`, 
      icon: "💬",
      description: "AI assistant",
      color: "#f59e0b"
    },
    { 
      label: "Analytics", 
      href: `/projects/${projectId}/analytics`, 
      icon: "📈",
      description: "Insights & trends",
      color: "#ec4899"
    },
  ];

  const handleBackToDashboard = () => {
  window.location.href = '/dashboard';  // ✅ forces full re-fetch instead of cached state
};

  return (
    <div style={styles.wrapper}>
      {/* Dynamic Background with Mouse Effect - Only apply transforms on client */}
      <div style={{
        ...styles.bgGradient1,
        transform: isClient ? `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` : 'none',
      }} suppressHydrationWarning></div>
      <div style={{
        ...styles.bgGradient2,
        transform: isClient ? `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)` : 'none',
      }} suppressHydrationWarning></div>
      <div style={styles.bgGrid}></div>

      {/* Floating Particles - Static on server, animated on client */}
      <div style={styles.particles} suppressHydrationWarning>
        {isClient ? (
          // Only render animated particles on client
          [...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.particle,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.1 + Math.random() * 0.1,
              }}
            />
          ))
        ) : (
          // Render static placeholder particles on server
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.particle,
                left: `${i * 20}%`,
                top: `${i * 15}%`,
                opacity: 0.1,
              }}
            />
          ))
        )}
      </div>

      {/* SIDEBAR */}
      <div
        ref={sidebarRef}
        style={{
          ...styles.sidebar,
          width: isSidebarCollapsed ? "88px" : "320px",
        }}
      >
        {/* Header with Logo */}
        <div style={styles.sidebarHeader}>
          <button 
            className="back-button"
            style={styles.backButton}
            onClick={handleBackToDashboard}
            title="Back to Dashboard"
          >
            <span style={styles.backIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {!isSidebarCollapsed && <span style={styles.backText}>Dashboard</span>}
          </button>
        </div>

        {/* Project Info with Hover Effect */}
        <div style={styles.projectInfo}>
          <div style={styles.projectIconWrapper}>
            <div style={styles.projectIcon}>🚀</div>
            <div style={styles.projectIconGlow}></div>
          </div>
          {!isSidebarCollapsed && (
            <div style={styles.projectDetails}>
              <div style={styles.projectLabel}>Current Workspace</div>
              <div style={styles.projectName}>{projectName}</div>
            </div>
          )}
        </div>

        {/* Animated Divider */}
        <div style={styles.divider}></div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const isHovered = hoveredItem === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...styles.navItem,
                  background: active 
                    ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                    : isHovered
                    ? `linear-gradient(135deg, ${item.color}10 0%, transparent 100%)`
                    : "transparent",
                  borderLeft: active ? `3px solid ${item.color}` : "3px solid transparent",
                  transform: isHovered ? "translateX(4px)" : "translateX(0)",
                }}
                title={isSidebarCollapsed ? item.label : ""}
              >
                <span style={{
                  ...styles.navIcon,
                  color: active ? item.color : "#e2e8f0",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}>
                  {item.icon}
                </span>
                
                {!isSidebarCollapsed && (
                  <div style={styles.navText}>
                    <span style={styles.navLabel}>{item.label}</span>
                    <span style={styles.navDescription}>{item.description}</span>
                  </div>
                )}
                
                {active && !isSidebarCollapsed && (
                  <span style={{
                    ...styles.activeIndicator,
                    color: item.color,
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="currentColor"/>
                    </svg>
                  </span>
                )}

                {/* Active glow effect */}
                {active && (
                  <div style={{
                    ...styles.activeGlow,
                    background: `radial-gradient(circle, ${item.color}30 0%, transparent 70%)`,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div style={styles.sidebarFooter}>
          <button
            className="collapse-button"
            style={styles.collapseButton}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span style={{
              ...styles.collapseIcon,
              transform: isSidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {!isSidebarCollapsed && (
            <div style={styles.workspaceStatus}>
              <div className="status-indicator" style={styles.statusIndicator}>
                <div style={styles.statusDot}></div>
                <div style={styles.statusPulse}></div>
                <span style={styles.statusText}>Intelligence Active</span>
              </div>
              
              {/* Live Activity Bar */}
              <div style={styles.activityBar}>
                <div style={styles.activityBarFill}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {/* Page Transition Effect */}
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles: any = {
wrapper: {
  display: "flex",
  height: "100vh",   // ← THIS must be height, not minHeight
  background: "#0f172a",
  color: "white",
  position: "relative",
  overflow: "hidden",
},
  bgGradient1: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: "800px",
    height: "800px",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
    transition: "transform 0.1s ease-out",
  },
  bgGradient2: {
    position: "absolute",
    bottom: "-20%",
    right: "-10%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
    transition: "transform 0.15s ease-out",
  },
  bgGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)
    `,
    backgroundSize: "50px 50px",
    pointerEvents: "none",
    zIndex: 0,
  },
  particles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
    width: "4px",
    height: "4px",
    background: "rgba(59,130,246,0.3)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  sidebar: {
    padding: "28px 20px",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    zIndex: 10,
    boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
  },
  sidebarHeader: {
    marginBottom: "28px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    width: "100%",
  },
  backIcon: {
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
  },
  backText: {
    letterSpacing: "0.3px",
  },
  projectInfo: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "28px",
    position: "relative",
    overflow: "hidden",
  },
  projectIconWrapper: {
    position: "relative",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  projectIcon: {
    fontSize: "32px",
    position: "relative",
    zIndex: 2,
    animation: "float 3s ease-in-out infinite",
  },
  projectIconGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "60px",
    height: "60px",
    background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    animation: "glow 3s ease-in-out infinite",
  },
  projectDetails: {
    flex: 1,
    minWidth: 0,
  },
  projectLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  projectName: {
    fontSize: "16px",
    color: "#fff",
    fontWeight: "600",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
    marginBottom: "28px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  navItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    cursor: "pointer",
  },
  navIcon: {
    fontSize: "22px",
    flexShrink: 0,
    width: "28px",
    textAlign: "center",
    transition: "transform 0.2s ease",
  },
  navText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  navLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  navDescription: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "400",
  },
  activeIndicator: {
    fontSize: "8px",
    color: "#3b82f6",
    animation: "pulse 2s ease-in-out infinite",
    marginLeft: "4px",
  },
  activeGlow: {
    position: "absolute",
    top: "50%",
    right: "0",
    width: "80px",
    height: "80px",
    transform: "translateY(-50%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  collapseButton: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "12px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  collapseIcon: {
    fontSize: "14px",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
  },
  workspaceStatus: {
    background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    position: "relative",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    position: "relative",
    zIndex: 2,
  },
  statusPulse: {
    position: "absolute",
    top: "50%",
    left: "8px",
    width: "20px",
    height: "20px",
    background: "#22c55e",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    animation: "pulse 2s ease-in-out infinite",
    opacity: 0.3,
    zIndex: 1,
  },
  statusText: {
    fontSize: "13px",
    color: "#22c55e",
    fontWeight: "600",
    letterSpacing: "0.3px",
    position: "relative",
    zIndex: 2,
  },
  activityBar: {
    marginTop: "12px",
    height: "4px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  activityBarFill: {
    width: "60%",
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #3b82f6)",
    borderRadius: "2px",
    animation: "slideIn 2s ease-in-out infinite",
  },
 content: {
  flex: 1,
  padding: "0",            // ← was "32px" — remove it
  position: "relative",
  zIndex: 1,
  overflowY: "auto",
  display: "flex",    // ← ADD
  flexDirection: "column", // ← ADD  
  minHeight: 0,            // ← ADD
},
contentWrapper: {
  animation: "slideIn 0.3s ease-out",
  flex: 1,                 // ← was height: "100%"
  minHeight: 0,            // ← ADD
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
},
};