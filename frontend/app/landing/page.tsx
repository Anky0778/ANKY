"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
import {
  Zap,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Target,
  Upload,
  MessageSquareText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import "./landing.css";

const STATS = [
  {
    number: "40–50%",
    title: "Of resolution time is diagnosis",
    desc: "Support engineers spend half their time hunting for information, not fixing issues. ANKY cuts through the noise.",
  },
  {
    number: "38%",
    title: "Incidents are recurring",
    desc: "Past incidents hold the answers. ANKY's similarity engine finds them in seconds, not hours.",
  },
  {
    number: "20–30%",
    title: "Annual knowledge loss",
    desc: "Engineers leave, knowledge leaves with them. ANKY is your team's permanent institutional memory.",
  },
];

const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: "Ingest everything",
    desc: "PDFs, SOPs, KT docs, historical incidents — ANKY reads and understands it all. One-time setup, permanent value.",
  },
  {
    icon: Zap,
    title: "Instant pattern matching",
    desc: "New incident? ANKY compares it against thousands of historical records and surfaces the most likely root causes.",
  },
  {
    icon: Target,
    title: "Top 5 similar incidents",
    desc: "Not just answers — context. See exactly how similar issues were resolved, with document references.",
  },
];

const FACTS = [
  { n: "40–50%", t: "Diagnosis dominates resolution time", d: "Most incident time is spent gathering information, not fixing. ANKY targets the biggest waste." },
  { n: "38%", t: "Incidents repeat themselves", d: "Production incidents are variations of past problems. Historical pattern matching is the obvious solution." },
  { n: "10k–100k+", t: "Incidents per year in enterprises", d: "Mid to large enterprises handle massive incident volumes. Manual analysis doesn't scale — AI does." },
  { n: "20–30%", t: "Annual knowledge loss", d: "Engineer turnover erodes expertise. ANKY preserves and institutionalizes knowledge permanently." },
  { n: "4–5", t: "Systems searched per incident", d: "Ticketing, logs, docs, wikis, dashboards — ANKY unifies them into one AI-powered interface." },
  { n: "10–15%", t: "MTTR reduction saves millions", d: "Even modest improvements in mean time to resolve have massive financial impact with SLA penalties." },
];

const STEPS = [
  { icon: Upload, title: "Upload knowledge", desc: "PDFs, Word docs, SOPs, historical incident reports — ANKY ingests and indexes everything securely." },
  { icon: MessageSquareText, title: "New incident arrives", desc: "Support team pastes the description. ANKY analyzes it against historical patterns instantly." },
  { icon: Sparkles, title: "Get root cause + context", desc: "ANKY suggests root cause and shows the top 5 similar incidents with resolution details." },
];

/* -----------------------------------------------------------
   Small helpers
----------------------------------------------------------- */

/** Counts the leading number in a string up from 0 once it scrolls into view. */
function CountUpText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(0);
  const match = text.match(/\d+/);

  useEffect(() => {
    if (!inView || !match) return;
    const target = parseInt(match[0], 10);
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  if (!match) return <span ref={ref}>{text}</span>;
  const prefix = text.slice(0, match.index);
  const suffix = text.slice((match.index ?? 0) + match[0].length);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/** Adds a cursor-tracking glow to any card via CSS vars --mx / --my. */
function useGlowTracking() {
  return (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

/* -----------------------------------------------------------
   Product flow visual — animated SVG diagram
----------------------------------------------------------- */

function FlowVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const sources = [
    { x: 90, y: 40, label: "PDFs" },
    { x: 90, y: 90, label: "SOPs" },
    { x: 90, y: 140, label: "Tickets" },
  ];
  const matches = [
    { x: 540, y: 30, label: "Match #1" },
    { x: 540, y: 68, label: "Match #2" },
    { x: 540, y: 106, label: "Match #3" },
    { x: 540, y: 144, label: "Match #4" },
    { x: 540, y: 182, label: "Match #5" },
  ];
  const core = { x: 320, y: 106 };
  const incident = { x: 90, y: 178 };

  return (
    <div className="flow-section container" ref={ref}>
      <motion.div
        className="flow-card"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 630 232" className="flow-svg" role="img" aria-label="ANKY analysis flow">
          {/* connecting lines: sources -> core */}
          {sources.map((s, i) => (
            <motion.path
              key={`s-${i}`}
              d={`M ${s.x + 34} ${s.y} C ${s.x + 110} ${s.y}, ${core.x - 110} ${core.y}, ${core.x - 34} ${core.y}`}
              stroke="rgba(79,124,255,0.35)"
              strokeWidth={1.5}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: "easeOut" }}
            />
          ))}
          {/* incident -> core */}
          <motion.path
            d={`M ${incident.x + 34} ${incident.y} C ${incident.x + 130} ${incident.y}, ${core.x - 120} ${core.y + 40}, ${core.x - 34} ${core.y + 10}`}
            stroke="rgba(167,139,250,0.5)"
            strokeWidth={2}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
          />
          {/* core -> matches */}
          {matches.map((m, i) => (
            <motion.path
              key={`m-${i}`}
              d={`M ${core.x + 34} ${core.y} C ${core.x + 110} ${core.y}, ${m.x - 110} ${m.y}, ${m.x - 30} ${m.y}`}
              stroke="rgba(79,124,255,0.3)"
              strokeWidth={1.5}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.7 + i * 0.07, ease: "easeOut" }}
            />
          ))}

          {/* source nodes */}
          {sources.map((s, i) => (
            <g key={`sn-${i}`}>
              <circle cx={s.x} cy={s.y} r={16} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
              <text x={s.x} y={s.y + 33} textAnchor="middle" className="flow-node-label">{s.label}</text>
            </g>
          ))}

          {/* incident node */}
          <g>
            <circle cx={incident.x} cy={incident.y} r={16} fill="rgba(167,139,250,0.12)" stroke="rgba(167,139,250,0.5)" />
            <text x={incident.x} y={incident.y + 33} textAnchor="middle" className="flow-node-label">New incident</text>
          </g>

          {/* core node — pulsing */}
          <motion.circle
            cx={core.x}
            cy={core.y}
            r={30}
            fill="rgba(79,124,255,0.14)"
            stroke="#4f7cff"
            strokeWidth={1.5}
            animate={{ r: [30, 34, 30] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx={core.x} cy={core.y} r={30} fill="none" stroke="rgba(79,124,255,0.5)" strokeWidth={1} />
          <text x={core.x} y={core.y - 3} textAnchor="middle" className="flow-node-label center">ANKY</text>
          <text x={core.x} y={core.y + 12} textAnchor="middle" className="flow-node-label">engine</text>

          {/* match nodes */}
          {matches.map((m, i) => (
            <g key={`mn-${i}`}>
              <circle cx={m.x} cy={m.y} r={13} fill="rgba(47,184,114,0.10)" stroke="rgba(47,184,114,0.55)" />
              <text x={m.x + 24} y={m.y + 4} textAnchor="start" className="flow-node-label">{m.label}</text>
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

/* -----------------------------------------------------------
   Steps timeline with scroll-driven progress line
----------------------------------------------------------- */

function StepsTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="steps-wrap" ref={ref}>
      <div className="steps-line-track">
        <motion.div className="steps-line-fill" style={{ scaleX }} />
      </div>
      <motion.div
        className="steps-grid"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        {STEPS.map((s, i) => (
          <motion.div className="step-card" key={s.title} variants={fadeUp} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <div className="step-number">{i + 1}</div>
            <div className="step-icon">
              <s.icon size={20} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* -----------------------------------------------------------
   Page
----------------------------------------------------------- */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const glow = useGlowTracking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      <div className="container">
        <div className="landing-nav-wrap">
          <nav className={`landing-nav${scrolled ? " scrolled" : ""}`}>
            <Link href="/" className="landing-logo">
              <span className="landing-logo-mark">
                <Image src="/anky_icon.png" alt="" width={22} height={22} style={{ objectFit: "contain" }} />
              </span>
              <span className="landing-logo-word">ANKY</span>
            </Link>
            <div className="nav-buttons">
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/signup" className="btn btn-primary btn-glow">
                Sign up <ArrowRight size={15} />
              </Link>
            </div>
          </nav>
        </div>

        <motion.section
          className="hero"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.span className="hero-badge" variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="hero-badge-dot" />
            <Zap size={13} /> AI-powered support assistant
          </motion.span>

          <motion.h1 variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            Turn incidents into<br />
            <span className="hero-gradient-text">insights, instantly</span>
          </motion.h1>

          <motion.p variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            ANKY learns from every incident, document, and resolution. Cut diagnosis time by 50% and
            never lose institutional knowledge again.
          </motion.p>

          <motion.div className="hero-buttons" variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <Link href="/login" className="btn btn-primary btn-lg btn-glow">
              Try the product
            </Link>
            <a href="#facts" className="btn btn-secondary btn-lg btn-glow">
              See the impact <ArrowRight size={15} />
            </a>
          </motion.div>

          <motion.div className="hero-trust" variants={fadeUp} transition={{ duration: 0.6 }}>
            <ShieldCheck size={14} /> Built for enterprise support teams — secure by design
          </motion.div>
        </motion.section>
      </div>

      <FlowVisual />

      <div className="container">
        <motion.div
          className="stats-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          {STATS.map((s) => (
            <motion.div
              className="tilt-card"
              key={s.title}
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onMouseMove={glow}
            >
              <div className="stat-number"><CountUpText text={s.number} /></div>
              <div className="stat-title">{s.title}</div>
              <div className="stat-desc">{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="value-props"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          {VALUE_PROPS.map((v) => (
            <motion.div className="value-item" key={v.title} variants={fadeUp} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <div className="value-icon">
                <v.icon size={20} />
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <section id="facts" className="facts-section">
          <span className="section-eyebrow">Why it matters</span>
          <h2 className="section-heading">Why enterprise IT needs ANKY</h2>
          <motion.div
            className="facts-grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10% 0px" }}
          >
            {FACTS.map((f) => (
              <motion.div
                className="fact-card"
                key={f.t}
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onMouseMove={glow}
              >
                <div className="fact-highlight"><CountUpText text={f.n} /></div>
                <div className="fact-text">{f.t}</div>
                <div className="fact-detail">{f.d}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="facts-section">
          <span className="section-eyebrow">The workflow</span>
          <h2 className="section-heading">How ANKY works</h2>
          <StepsTimeline />
        </section>

        <section className="cta-section">
          <motion.div
            className="cta-box"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cta-icon-ring">
              <ShieldCheck size={26} />
            </div>
            <h2>Ready to cut incident diagnosis time in half?</h2>
            <p>Join enterprises using ANKY to preserve knowledge, accelerate resolution, and meet SLAs consistently.</p>
            <Link href="/signup" className="btn btn-primary btn-lg btn-glow">
              Start free trial <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>

        <footer className="landing-footer">
          <div>
            <p>© 2026 ANKY — Anonymous Neural Knowledge Yard. All rights reserved.</p>
            <p className="footer-sub">Built for enterprise support teams who never want to chase the same answer twice.</p>
          </div>
          <button className="footer-top-btn" onClick={scrollToTop}>
            <ArrowUp size={13} /> Back to top
          </button>
        </footer>
      </div>
    </div>
  );
}
