import React, { useState, useEffect } from 'react';

export default function Gateway({ onSelect }) {
  const [showExec, setShowExec] = useState(false);

  // ── Cloaked Orbit: Ctrl+Shift+X reveals Executive Gate ──
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
        e.preventDefault();
        setShowExec(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const scrollToGates = () => {
    document.getElementById('gates-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="landing-header">
        <div className="landing-header__logo">
          <span className="logo-mark">⬡</span> Aegis AI
        </div>
        <nav className="landing-header__nav">
          <a href="#features">Architecture</a>
          <button className="btn-primary btn-small" onClick={scrollToGates}>Launch Portals</button>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero__content">
          <h1 className="landing-hero__title">National Identity Protection Platform</h1>
          <p className="landing-hero__subtitle">
            Aegis AI integrates military-grade facial verification with a zero-trust fraud analytics pipeline. 
            Protecting citizens, empowering analysts, and securing the nation's digital infrastructure.
          </p>
        </div>

        {/* The Gates */}
        <div id="gates-section" className="gateway__gates">
          {/* Citizen Gate — Public */}
          <div className="gate" onClick={() => onSelect('citizen')}>
            <div className="gate__icon gate__icon--citizen">◈</div>
            <div className="gate__title">Citizen Gate</div>
            <div className="gate__desc">
              Personal identity verification, document submission, and protection status monitoring.
            </div>
          </div>

          {/* Analyst Gate — Restricted */}
          <div className="gate" onClick={() => onSelect('analyst')}>
            <div className="gate__icon gate__icon--analyst">◉</div>
            <div className="gate__title">Analyst Gate</div>
            <div className="gate__desc">
              Fraud investigation terminal. Restricted to authorized verification officers.
            </div>
          </div>

          {/* Executive Gate — Cloaked Orbit */}
          {showExec && (
            <div className="gate gate--exec" onClick={() => onSelect('executive')}>
              <div className="gate__icon gate__icon--exec">⬡</div>
              <div className="gate__title">Executive Suite</div>
              <div className="gate__desc">
                Superadmin authorization console. Infrastructure integration controls.
              </div>
            </div>
          )}
        </div>
        <div className="gateway__hint" style={{marginTop: '40px', position: 'relative', bottom: 0}}>
          {showExec ? 'Executive node active' : 'Secure access layer — Select your identity vector'}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">⛓️</div>
          <h3>Cascading Trust Pipeline</h3>
          <p>A rigorous 3-tier zero-trust verification system. Every identity state transition requires cryptographic proof and strict authorization.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👁️</div>
          <h3>AI Face Verification</h3>
          <p>Powered by OpenCV heuristics and NVIDIA DeepSeek-V4 reasoning. Real-time liveness detection and military-grade facial topography matching.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Immutable Audit Trail</h3>
          <p>Every login attempt, mismatch, and administrative override is logged into an immutable database monitored by the SOC.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-mark">⬡</span> Aegis AI
          </div>
          <div className="footer-links">
            <span>© 2026 Aegis AI Infrastructure</span>
            <span className="footer-divider">|</span>
            <span>Strictly Confidential</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
