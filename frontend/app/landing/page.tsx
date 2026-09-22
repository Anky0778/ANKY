"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  ArrowRight,
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

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="container">
        <nav className="landing-nav">
          <div className="landing-logo">
            <Image src="/anky_logo.png" alt="ANKY" width={32} height={32} style={{ objectFit: "contain" }} />
            <span>ANKY</span>
          </div>
          <div className="nav-buttons">
            <Link href="/login" className="btn btn-ghost">Sign in</Link>
            <Link href="/signup" className="btn btn-primary">
              Sign up <ArrowRight size={15} />
            </Link>
          </div>
        </nav>

        <section className="hero">
          <span className="hero-badge"><Zap size={13} /> AI-powered support assistant</span>
          <h1>
            Turn incidents into<br />insights, instantly
          </h1>
          <p>
            ANKY learns from every incident, document, and resolution. Cut diagnosis time by 50% and
            never lose institutional knowledge again.
          </p>
          <div className="hero-buttons">
            <Link href="/login" className="btn btn-primary btn-lg">Try the product</Link>
            <a href="#facts" className="btn btn-secondary btn-lg">
              See the impact <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <div className="stats-grid">
          {STATS.map((s) => (
            <div className="stat-card" key={s.title}>
              <div className="stat-number">{s.number}</div>
              <div className="stat-title">{s.title}</div>
              <div className="stat-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="value-props">
          {VALUE_PROPS.map((v) => (
            <div className="value-item" key={v.title}>
              <div className="value-icon">
                <v.icon size={20} />
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>

        <section id="facts" className="facts-section">
          <h2 className="section-heading">Why enterprise IT needs ANKY</h2>
          <div className="facts-grid">
            {FACTS.map((f) => (
              <div className="fact-card" key={f.t}>
                <div className="fact-highlight">{f.n}</div>
                <div className="fact-text">{f.t}</div>
                <div className="fact-detail">{f.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="facts-section">
          <h2 className="section-heading">How ANKY works</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card" key={s.title}>
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">
                  <s.icon size={20} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <ShieldCheck size={28} style={{ marginBottom: 16, color: "var(--brand)" }} />
          <h2>Ready to cut incident diagnosis time in half?</h2>
          <p>Join enterprises using ANKY to preserve knowledge, accelerate resolution, and meet SLAs consistently.</p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start free trial <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="landing-footer">
          <p>© 2026 ANKY — Anonymous Neural Knowledge Yard. All rights reserved.</p>
          <p className="footer-sub">Built for enterprise support teams who never want to chase the same answer twice.</p>
        </footer>
      </div>
    </div>
  );
}
