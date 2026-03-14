"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchProjectById } from "@/app/services/projects";
import { fetchAnalytics } from "@/app/services/analytics";
import api from "@/app/services/api";

interface Project {
  id: string; name: string; description: string | null; is_trained: boolean; created_at: string;
}
interface Analytics {
  incident_count: number; chat_sessions_count: number; message_count: number; ai_calls: number; chat_usage_per_incident: number;
}
interface TrendWeek { week: string; sessions: number; ai_calls: number; }
interface Trend { weeks: TrendWeek[]; total_incidents: number; }

function useCounter(target: number, duration = 1600, startDelay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [target, duration, startDelay]);
  return value;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number, W = 0, H = 0;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const init = () => { nodes.length = 0; for (let i = 0; i < 36; i++) nodes.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3, r: Math.random()*1.8+1.2, o: Math.random()*.45+.15 }); };
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) { const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy); if(d<155){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(20,184,166,${.15*(1-d/155)})`;ctx.lineWidth=.6;ctx.stroke();} }
      for (const n of nodes) { ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle=`rgba(20,184,166,${n.o})`;ctx.fill();n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1; }
      animId=requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    window.addEventListener("resize", () => { resize(); init(); });
    return () => { cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:.65 }} />;
}

function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:12, height:12 }}>
      <span style={{ position:"absolute", width:"100%", height:"100%", borderRadius:"50%", background:color, opacity:.4, animation:"pulse-ring 2s ease-out infinite" }} />
      <span style={{ width:8, height:8, borderRadius:"50%", background:color, display:"block", position:"relative" }} />
    </span>
  );
}

function TrendChart({ trend }: { trend: Trend }) {
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState<{ i: number; week: TrendWeek } | null>(null);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 120); return () => clearTimeout(t); }, []);

  const { weeks } = trend;
  const overallMax = Math.max(...weeks.map(w => Math.max(w.sessions, w.ai_calls)), 1);
  const CHART_H = 150, BAR_W = 14, GAP = 5, GROUP_W = 44, LABEL_H = 26;
  const totalW = weeks.length * (GROUP_W + 10) + 40;
  const isEmpty = weeks.every(w => w.sessions === 0 && w.ai_calls === 0);

  if (isEmpty) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:210, gap:10 }}>
      <div style={{ fontSize:30, opacity:.25 }}>📊</div>
      <p style={{ fontSize:13, color:"#334155", margin:0, textAlign:"center" }}>No activity in the last 8 weeks.<br/>Start using Chat to see trends here.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", gap:18, marginBottom:14, fontSize:12, color:"#475569" }}>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:10, height:10, borderRadius:2, background:"#a855f7", display:"inline-block" }} /> Chat Sessions</span>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:10, height:10, borderRadius:2, background:"#14b8a6", display:"inline-block" }} /> AI Calls</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${CHART_H + LABEL_H + 10}`} style={{ display:"block", overflow:"visible" }}>
        {[0,.25,.5,.75,1].map((f,i) => {
          const y = CHART_H * (1-f);
          return <g key={i}><line x1={28} y1={y} x2={totalW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1}/><text x={22} y={y+4} textAnchor="end" fontSize={9} fill="#334155" fontFamily="inherit">{Math.round(overallMax*f)}</text></g>;
        })}
        {weeks.map((w, i) => {
          const gx = 34 + i * (GROUP_W + 10);
          const sH = animated ? (w.sessions / overallMax) * CHART_H : 0;
          const aH = animated ? (w.ai_calls  / overallMax) * CHART_H : 0;
          const isHovered = tooltip?.i === i;
          return (
            <g key={i} style={{ cursor:"pointer" }}
              onMouseEnter={() => setTooltip({ i, week: w })}
              onMouseLeave={() => setTooltip(null)}
            >
              {isHovered && <rect x={gx-4} y={0} width={GROUP_W+8} height={CHART_H} rx={4} fill="rgba(255,255,255,0.03)" />}
              <rect x={gx} y={CHART_H-sH} width={BAR_W} height={sH} rx={3} fill="#a855f7" opacity={isHovered ? 1 : 0.8}
                style={{ transition:"y .65s cubic-bezier(.22,1,.36,1), height .65s cubic-bezier(.22,1,.36,1)", transitionDelay:`${i*.05}s` }} />
              <rect x={gx+BAR_W+GAP} y={CHART_H-aH} width={BAR_W} height={aH} rx={3} fill="#14b8a6" opacity={isHovered ? 1 : 0.8}
                style={{ transition:"y .65s cubic-bezier(.22,1,.36,1), height .65s cubic-bezier(.22,1,.36,1)", transitionDelay:`${i*.05+.03}s` }} />
              <text x={gx+GROUP_W/2-2} y={CHART_H+LABEL_H} textAnchor="middle" fontSize={10} fill={isHovered ? "#94a3b8" : "#334155"} fontFamily="inherit">{w.week}</text>
            </g>
          );
        })}
        <line x1={28} y1={CHART_H} x2={totalW} y2={CHART_H} stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
        {tooltip && (() => {
          const gx = 34 + tooltip.i * (GROUP_W + 10);
          const tx = Math.min(gx + GROUP_W/2, totalW - 60);
          const ty = Math.max(CHART_H - Math.max((tooltip.week.sessions/overallMax)*CHART_H, (tooltip.week.ai_calls/overallMax)*CHART_H) - 50, 4);
          return (
            <g>
              <rect x={tx-46} y={ty} width={92} height={42} rx={6} fill="#0f172a" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8}/>
              <text x={tx} y={ty+14} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="inherit">{tooltip.week.week}</text>
              <text x={tx-2} y={ty+28} textAnchor="middle" fontSize={10} fill="#d8b4fe" fontFamily="inherit">{tooltip.week.sessions} sessions</text>
              <text x={tx} y={ty+40} textAnchor="middle" fontSize={10} fill="#5eead4" fontFamily="inherit">{tooltip.week.ai_calls} AI calls</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function StatCard({ label, value, suffix="", icon, color, delay=0 }: { label:string; value:number; suffix?:string; icon:string; color:string; delay?:number }) {
  const counted = useCounter(Math.round(value), 1600, delay);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t=setTimeout(()=>setVisible(true),delay); return ()=>clearTimeout(t); }, [delay]);
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"20px 22px", display:"flex", flexDirection:"column", gap:10, position:"relative", overflow:"hidden", transform:visible?"translateY(0)":"translateY(18px)", opacity:visible?1:0, transition:"transform .55s cubic-bezier(.22,1,.36,1), opacity .45s ease" }}>
      <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle at 80% 20%, ${color}22, transparent 70%)`, pointerEvents:"none" }} />
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.5px" }}>{value===0?"—":`${counted.toLocaleString()}${suffix}`}</div>
      <div style={{ fontSize:11, color:"#64748b", letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}, transparent)`, opacity:.45 }} />
    </div>
  );
}

function PipelineStep({ label, done, delay }: { label:string; done:boolean; delay:number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t=setTimeout(()=>setVisible(true),delay); return ()=>clearTimeout(t); }, [delay]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:done?"rgba(20,184,166,0.08)":"rgba(255,255,255,0.02)", border:`1px solid ${done?"rgba(20,184,166,0.25)":"rgba(255,255,255,0.05)"}`, transform:visible?"translateX(0)":"translateX(-16px)", opacity:visible?1:0, transition:"transform .5s cubic-bezier(.22,1,.36,1), opacity .4s ease" }}>
      <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background:done?"#14b8a6":"#334155", boxShadow:done?"0 0 8px #14b8a699":"none" }} />
      <span style={{ fontSize:13, color:done?"#5eead4":"#475569", fontWeight:done?500:400 }}>{label}</span>
      {done && <span style={{ marginLeft:"auto", fontSize:11, color:"#14b8a6" }}>✓</span>}
    </div>
  );
}

export default function ProjectOverview() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject]     = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [trend, setTrend]         = useState<Trend | null>(null);
  const [loading, setLoading]     = useState(true);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const id = Array.isArray(projectId) ? projectId[0] : projectId;
    // project + analytics are required; trend is optional — page loads even if endpoint isn't deployed yet
    Promise.all([
      fetchProjectById(id),
      fetchAnalytics(id),
    ]).then(([proj, anal]) => {
      setProject(proj);
      setAnalytics(anal);
      setLoading(false);
      // trend loads independently — won't block the page
      api.get(`/projects/${id}/analytics/trend`)
        .then(r => setTrend(r.data))
        .catch(() => setTrend({ weeks: [], total_incidents: anal?.incident_count ?? 0 }));
    }).catch(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!loading) { const t = setTimeout(() => setHeaderVisible(true), 80); return () => clearTimeout(t); }
  }, [loading]);

  if (loading || !project) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", color:"#475569" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ width:28, height:28, border:"2px solid #14b8a6", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
        <span style={{ fontSize:13 }}>Loading workspace...</span>
      </div>
    </div>
  );

  const trained = project.is_trained;
  const a = analytics;
  const aiRatio = a && a.message_count > 0 ? Math.round((a.ai_calls / a.message_count) * 100) : 0;

  const pipeline = ["Validate uploaded data","Extract & normalize text","Chunk documents","Generate embeddings","Build FAISS vector index","Finalize intelligence layer"];

  const insightText = (() => {
    if (!a || a.chat_sessions_count === 0) return null;
    if (a.chat_usage_per_incident < 0.1) return `Low AI adoption — only ${a.chat_sessions_count} session${a.chat_sessions_count!==1?"s":""} across ${a.incident_count} incidents. Engineers aren't consistently using the assistant during triage.`;
    if (a.chat_usage_per_incident < 0.5) return `Moderate AI usage across ${a.incident_count} incidents. ${a.chat_sessions_count} sessions created — consider querying the assistant earlier in the investigation process.`;
    return `Strong AI engagement — ${a.chat_sessions_count} sessions across ${a.incident_count} incidents (${a.chat_usage_per_incident.toFixed(2)} per incident). Engineers are actively leveraging the assistant.`;
  })();

  return (
    <>
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.9);opacity:0} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes fade-up     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ov-btn  { display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#cbd5e1;font-size:13px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s,transform .15s; }
        .ov-btn:hover { background:rgba(20,184,166,0.12);border-color:rgba(20,184,166,0.4);color:#5eead4;transform:translateY(-1px); }
        .ov-card { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;cursor:pointer;transition:border-color .2s,transform .2s; }
        .ov-card:hover { transform:translateY(-2px); }
      `}</style>

      <div style={{ padding:"40px 48px", maxWidth:1300, margin:"0 auto", display:"flex", flexDirection:"column", gap:28 }}>

        {/* Hero */}
        <div style={{ position:"relative", borderRadius:20, overflow:"hidden", background:"linear-gradient(135deg,#0f172a 0%,#0d1f2d 50%,#0f172a 100%)", border:"1px solid rgba(20,184,166,0.2)", padding:"40px 44px", minHeight:190, transform:headerVisible?"translateY(0)":"translateY(24px)", opacity:headerVisible?1:0, transition:"transform .65s cubic-bezier(.22,1,.36,1), opacity .5s ease" }}>
          <ParticleCanvas />
          <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <PulseDot color={trained?"#14b8a6":"#f59e0b"} />
                <span style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:trained?"#14b8a6":"#f59e0b", fontWeight:600 }}>{trained?"Intelligence Ready":"Training Required"}</span>
              </div>
              <h1 style={{ fontSize:34, fontWeight:700, color:"#f1f5f9", margin:0, letterSpacing:"-0.5px", lineHeight:1.15 }}>{project.name}</h1>
              <p style={{ color:"#64748b", marginTop:8, fontSize:14, maxWidth:500, lineHeight:1.6 }}>{project.description||"No description provided."}</p>
              <p style={{ color:"#334155", marginTop:6, fontSize:12 }}>Workspace created {new Date(project.created_at).getFullYear()}</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
              <div style={{ background:trained?"rgba(20,184,166,0.12)":"rgba(245,158,11,0.12)", border:`1px solid ${trained?"rgba(20,184,166,0.3)":"rgba(245,158,11,0.3)"}`, borderRadius:12, padding:"12px 20px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em" }}>AI Status</div>
                <div style={{ fontSize:17, fontWeight:700, color:trained?"#5eead4":"#fcd34d", marginTop:4 }}>{trained?"Operational":"Standby"}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="ov-btn" onClick={()=>router.push(`/projects/${projectId}/chat`)}>💬 Chat</button>
                <button className="ov-btn" onClick={()=>router.push(`/projects/${projectId}/training`)}>⚡ Training</button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          <StatCard label="Incidents Indexed" value={a?.incident_count??0}       icon="🚨" color="#ef4444" delay={150}/>
          <StatCard label="Chat Sessions"      value={a?.chat_sessions_count??0} icon="💬" color="#a855f7" delay={270}/>
          <StatCard label="Messages Sent"      value={a?.message_count??0}       icon="✉️" color="#3b82f6" delay={390}/>
          <StatCard label="AI Assist Ratio"    value={aiRatio} suffix="%"        icon="🤖" color="#14b8a6" delay={510}/>
        </div>

        {/* Trend chart + pipeline */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"24px", animation:"fade-up .6s ease .5s both" }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Activity Trend</h2>
            <p style={{ margin:"4px 0 16px", fontSize:12, color:"#475569" }}>
              Chat sessions &amp; AI calls — last 8 weeks
              {trend && trend.total_incidents > 0 && <span style={{ marginLeft:10, color:"#334155" }}>· {trend.total_incidents.toLocaleString()} incidents total</span>}
            </p>
            {trend
              ? <TrendChart trend={trend} />
              : <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"#334155", fontSize:13 }}>Loading...</div>
            }
          </div>

          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"24px", display:"flex", flexDirection:"column", gap:9, animation:"fade-up .6s ease .65s both" }}>
            <div style={{ marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Intelligence Pipeline</h2>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#475569" }}>{trained?"All stages complete":"Awaiting training trigger"}</p>
            </div>
            {pipeline.map((step,i) => <PipelineStep key={i} label={step} done={trained} delay={600+i*70}/>)}
            {!trained && <button className="ov-btn" style={{ marginTop:4, justifyContent:"center", borderColor:"rgba(168,85,247,0.35)", color:"#d8b4fe" }} onClick={()=>router.push(`/projects/${projectId}/training`)}>⚡ Start Training</button>}
          </div>
        </div>

        {/* Usage insight */}
        {insightText && (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"22px 28px", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap", animation:"fade-up .6s ease .8s both" }}>
            <div style={{ fontSize:26 }}>📈</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Usage Insight</div>
              <p style={{ margin:0, fontSize:13, color:"#64748b", lineHeight:1.7 }}>{insightText}</p>
            </div>
            <button className="ov-btn" onClick={()=>router.push(`/projects/${projectId}/analytics`)}>View Analytics →</button>
          </div>
        )}

        {/* Nav cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, animation:"fade-up .6s ease .9s both" }}>
          {[
            { title:"Knowledge Base",   desc:"Upload runbooks, architecture guides, and SOPs to expand the AI's understanding of your system.", icon:"📚", color:"#14b8a6", href:`/projects/${projectId}/documents`, cta:"Manage Documents" },
            { title:"Incident History", desc:`${a?.incident_count??0} incidents indexed. Import more from ServiceNow, Jira, or CSV to improve accuracy.`, icon:"🚨", color:"#ef4444", href:`/projects/${projectId}/incidents`, cta:"View Incidents" },
            { title:"Analytics",        desc:`${a?.chat_sessions_count??0} sessions, ${a?.ai_calls??0} AI calls logged. Explore root cause trends and failure patterns.`, icon:"📊", color:"#a855f7", href:`/projects/${projectId}/analytics`, cta:"Open Analytics" },
          ].map((card,i) => (
            <div key={i} className="ov-card"
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=`${card.color}55`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.07)";}}
              onClick={()=>router.push(card.href)}
            >
              <div style={{ position:"absolute", top:0, right:0, width:90, height:90, background:`radial-gradient(circle at 80% 20%, ${card.color}18, transparent 70%)`, pointerEvents:"none" }} />
              <span style={{ fontSize:22 }}>{card.icon}</span>
              <h3 style={{ margin:0, fontSize:15, fontWeight:600, color:"#e2e8f0" }}>{card.title}</h3>
              <p style={{ margin:0, fontSize:13, color:"#475569", lineHeight:1.6 }}>{card.desc}</p>
              <div style={{ marginTop:"auto", paddingTop:10, display:"flex", alignItems:"center", gap:6, fontSize:12, color:card.color, fontWeight:500 }}>{card.cta} <span>→</span></div>
            </div>
          ))}
        </div>

        {/* System summary */}
        <div style={{ background:"linear-gradient(135deg,rgba(20,184,166,0.05) 0%,rgba(168,85,247,0.05) 100%)", border:"1px solid rgba(20,184,166,0.13)", borderRadius:14, padding:"18px 26px", display:"flex", alignItems:"center", gap:18, flexWrap:"wrap", animation:"fade-up .6s ease 1.05s both" }}>
          <div style={{ fontSize:18 }}>⚙️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>System Architecture</div>
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              {["Semantic embeddings power contextual retrieval","FAISS vector index enables high-speed similarity search","AI assists engineers in identifying root causes"].map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#475569" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"#14b8a6", display:"inline-block", flexShrink:0 }} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
