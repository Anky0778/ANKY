"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [theme, setTheme] = useState<"navy" | "dark">("navy");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "navy" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = (selectedTheme: "navy" | "dark") => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary-navy: #0a1928;
          --secondary-navy: #1a2f3f;
          --accent-blue: #3b82f6;
          --text-light: #e2e8f0;
          --text-dim: #94a3b8;
          --card-bg: rgba(30, 41, 59, 0.7);
          --border-color: #2d3a4f;
          --gradient-start: #0a1928;
          --gradient-end: #1e3a5f;
          --logo-opacity: 0.03;
        }

        [data-theme="dark"] {
          --primary-navy: #0b0f17;
          --secondary-navy: #1a1e2a;
          --accent-blue: #60a5fa;
          --text-light: #f1f5f9;
          --text-dim: #9ca3af;
          --card-bg: rgba(23, 25, 35, 0.8);
          --border-color: #2d3349;
          --gradient-start: #0b0f17;
          --gradient-end: #1f2937;
          --logo-opacity: 0.04;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
          color: var(--text-light);
          min-height: 100vh;
          transition: background 0.3s ease, color 0.2s ease;
          overflow-x: hidden;
          position: relative;
        }

        /* Animated background logo */
        .logo-watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120vmin;
  height: 120vmin;
  opacity: var(--logo-opacity);
  pointer-events: none;
  z-index: 0;
  animation: slowRotate 60s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

        @keyframes slowRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Navigation */
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          animation: fadeInDown 1s ease;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-blue), #2563eb);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
          transform: rotate(45deg);
          transition: transform 0.3s ease;
        }

        .logo-icon:hover {
          transform: rotate(90deg);
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .theme-toggle {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          padding: 0.3rem;
          cursor: pointer;
          display: flex;
          gap: 0.3rem;
          backdrop-filter: blur(10px);
        }

        .theme-toggle span {
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .theme-toggle .active {
          background: var(--accent-blue);
          color: white;
        }

        .btn {
          padding: 0.6rem 1.5rem;
          border-radius: 30px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-light);
        }

        .btn-outline:hover {
          border-color: var(--accent-blue);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
        }

        .btn-primary {
          background: var(--accent-blue);
          color: white;
          border: 1px solid var(--accent-blue);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
          filter: brightness(1.1);
        }

        .btn-large {
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
        }

        /* Hero Section */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 0 2rem;
          animation: fadeInUp 1s ease;
        }

        .hero-badge {
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          padding: 0.5rem 1.5rem;
          border-radius: 30px;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          display: inline-block;
          color: var(--text-dim);
        }

        .hero h1 {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #fff, var(--text-dim));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -2px;
        }

        .hero p {
          font-size: clamp(1rem, 4vw, 1.25rem);
          color: var(--text-dim);
          max-width: 800px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 4rem 0;
        }

        .stat-card {
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-blue), #2563eb);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--accent-blue);
        }

        .stat-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-light);
        }

        .stat-desc {
          color: var(--text-dim);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Features/Value Props */
        .value-props {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin: 6rem 0;
        }

        .value-item {
          text-align: center;
          padding: 2rem;
        }

        .value-icon {
          width: 60px;
          height: 60px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 1.5rem;
          color: var(--accent-blue);
          transition: all 0.3s ease;
        }

        .value-item:hover .value-icon {
          transform: scale(1.1) rotate(5deg);
          border-color: var(--accent-blue);
        }

        .value-item h3 {
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .value-item p {
          color: var(--text-dim);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* Facts Grid */
        .facts-section {
          margin: 6rem 0;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
          background: linear-gradient(to right, #fff, var(--text-dim));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .facts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .fact-card {
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .fact-card:hover {
          transform: translateX(5px);
          border-left: 4px solid var(--accent-blue);
        }

        .fact-highlight {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-blue);
          margin-bottom: 0.5rem;
        }

        .fact-text {
          color: var(--text-light);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .fact-detail {
          color: var(--text-dim);
          font-size: 0.9rem;
        }

        /* CTA Section */
        .cta-section {
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          border-radius: 40px;
          padding: 4rem;
          text-align: center;
          margin: 6rem 0;
        }

        .cta-section h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .cta-section p {
          color: var(--text-dim);
          max-width: 600px;
          margin: 0 auto 2rem;
          font-size: 1.1rem;
        }

        /* Footer */
        footer {
          padding: 2rem 0;
          text-align: center;
          color: var(--text-dim);
          border-top: 1px solid var(--border-color);
          margin-top: 4rem;
        }

        /* Animations */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          nav {
            flex-direction: column;
            gap: 1rem;
          }
          
          .hero h1 {
            font-size: 2.5rem;
          }
          
          .cta-section {
            padding: 2rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Custom cursor effect */
        .cursor-glow {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 50%;
          filter: blur(40px);
        }
      `}</style>

      {/* Logo Watermark - Replace with your actual logo */}
      <div className="logo-watermark">
  <div style={{ 
    position: 'relative', 
    width: '100%', 
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <Image 
      src="/anky_logo.png"
      alt="ANKY Logo"
      width={800}
      height={800}
      style={{ 
        objectFit: 'contain', 
        opacity: 0.5,
        maxWidth: '80vmin',
        maxHeight: '80vmin'
      }}
    />
  </div>
</div>

      {/* Cursor Glow Effect */}
      <div className="cursor-glow" id="cursorGlow"></div>

      <div className="container">
        {/* Navigation */}
        <nav>
          <div className="logo">
  <div style={{ 
    width: '40px', 
    height: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <Image 
      src="/anky_logo.png"
      alt="ANKY"
      width={160}
      height={150}
      style={{ objectFit: 'contain' }}
    />
  </div>
  <span></span>
</div>
          <div className="nav-buttons">
            <div className="theme-toggle">
              <span 
                className={theme === 'navy' ? 'active' : ''} 
                onClick={() => toggleTheme('navy')}
              >
                Navy
              </span>
              <span 
                className={theme === 'dark' ? 'active' : ''} 
                onClick={() => toggleTheme('dark')}
              >
                Dark
              </span>
            </div>
            <Link href="/login" className="btn btn-outline">Sign In</Link>
            <Link href="/signup" className="btn btn-primary">Sign Up →</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <span className="hero-badge">⚡ AI-Powered Support Assistant</span>
          <h1>Turn Incidents into<br />Insights, Instantly</h1>
          <p>ANKY learns from every incident, document, and resolution. Cut diagnosis time by 50% and never lose institutional knowledge again.</p>
          <div className="hero-buttons">
            <Link href="/login" className="btn btn-primary btn-large floating">Try Prototype</Link>
            <a href="#facts" className="btn btn-outline btn-large">See The Impact →</a>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">40-50%</div>
            <div className="stat-title">Of resolution time = Diagnosis</div>
            <div className="stat-desc">Support engineers spend half their time hunting for information, not fixing issues. ANKY cuts through the noise.</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">60-70%</div>
            <div className="stat-title">Incidents are recurring</div>
            <div className="stat-desc">Past incidents hold the answers. ANKY's similarity engine finds them in seconds, not hours.</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">20-30%</div>
            <div className="stat-title">Annual knowledge loss</div>
            <div className="stat-desc">Engineers leave, knowledge leaves with them. ANKY is your team's permanent institutional memory.</div>
          </div>
        </div>

        {/* Value Props */}
        <div className="value-props">
          <div className="value-item">
            <div className="value-icon">📚</div>
            <h3>Ingest Everything</h3>
            <p>PDFs, SOPs, KT docs, historical incidents—ANKY reads and understands it all. One-time setup, permanent value.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">⚡</div>
            <h3>Instant Pattern Matching</h3>
            <p>New incident? ANKY compares with 10,000+ historical records and surfaces the most likely root causes.</p>
          </div>
          <div className="value-item">
            <div className="value-icon">🎯</div>
            <h3>Top 5 Similar Incidents</h3>
            <p>Not just answers—context. See exactly how similar issues were resolved, with document references.</p>
          </div>
        </div>

        {/* Facts Grid */}
        <section id="facts" className="facts-section">
          <h2 className="section-title">Why Enterprise IT Needs ANKY</h2>
          <div className="facts-grid">
            <div className="fact-card">
              <div className="fact-highlight">40-50%</div>
              <div className="fact-text">Diagnosis dominates resolution time</div>
              <div className="fact-detail">Industry standard: Most incident time is spent gathering information, not fixing. ANKY targets the biggest waste.</div>
            </div>
            <div className="fact-card">
              <div className="fact-highlight">60-70%</div>
              <div className="fact-text">Incidents repeat themselves</div>
              <div className="fact-detail">Production incidents are variations of past problems. Historical pattern matching is the obvious solution.</div>
            </div>
            <div className="fact-card">
              <div className="fact-highlight">10,000-100k+</div>
              <div className="fact-text">Incidents per year in enterprises</div>
              <div className="fact-detail">Mid to large enterprises handle massive incident volumes. Manual analysis doesn't scale—AI does.</div>
            </div>
            <div className="fact-card">
              <div className="fact-highlight">20-30%</div>
              <div className="fact-text">Annual knowledge loss</div>
              <div className="fact-detail">Engineer turnover erodes expertise. ANKY preserves and institutionalizes knowledge permanently.</div>
            </div>
            <div className="fact-card">
              <div className="fact-highlight">4-5</div>
              <div className="fact-text">Systems searched per incident</div>
              <div className="fact-detail">Ticketing, logs, docs, wikis, dashboards—ANKY unifies them into one AI-powered interface.</div>
            </div>
            <div className="fact-card">
              <div className="fact-highlight">10-15%</div>
              <div className="fact-text">MTTR reduction saves millions</div>
              <div className="fact-detail">Even modest improvements in mean time to resolve have massive financial impact with SLA penalties.</div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="facts-section">
          <h2 className="section-title">How ANKY Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div className="fact-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>1️⃣</div>
              <h3>Upload Knowledge</h3>
              <p style={{ color: 'var(--text-dim)' }}>PDFs, Word docs, SOPs, historical incident reports—ANKY ingests and indexes everything securely.</p>
            </div>
            <div className="fact-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>2️⃣</div>
              <h3>New Incident Arrives</h3>
              <p style={{ color: 'var(--text-dim)' }}>Support team pastes the description. ANKY analyzes it against historical patterns instantly.</p>
            </div>
            <div className="fact-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>3️⃣</div>
              <h3>Get Root Cause + Context</h3>
              <p style={{ color: 'var(--text-dim)' }}>ANKY suggests root cause and shows top 5 similar incidents with resolution details.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2>Ready to cut incident diagnosis time in half?</h2>
          <p>Join enterprises using ANKY to preserve knowledge, accelerate resolution, and meet SLAs consistently.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-large">Start Free Trial →</Link>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <p>© 2026 ANKY - Anonymous Neural Knowledge Yard. All rights reserved.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Built for enterprise support teams who never want to chase the same answer twice.</p>
        </footer>
      </div>

      {/* Scripts for effects */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Smooth cursor glow effect
          const cursorGlow = document.getElementById('cursorGlow');
          
          document.addEventListener('mousemove', function(e) {
            if (cursorGlow) {
              cursorGlow.style.left = e.clientX - 200 + 'px';
              cursorGlow.style.top = e.clientY - 200 + 'px';
              cursorGlow.style.opacity = '1';
            }
          });

          document.addEventListener('mouseleave', function() {
            if (cursorGlow) {
              cursorGlow.style.opacity = '0';
            }
          });

          // Intersection Observer for fade-in animations
          const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
          };

          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
              }
            });
          }, observerOptions);

          document.querySelectorAll('.stat-card, .fact-card, .value-item, .cta-section').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
          });

          // Parallax effect for watermark
          window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            const watermark = document.querySelector('.logo-watermark');
            if (watermark) {
              watermark.style.transform = \`translate(-50%, calc(-50% + \${scrollY * 0.1}px)) rotate(\${scrollY * 0.02}deg)\`;
            }
          });
        `
      }} />
    </>
  );
}