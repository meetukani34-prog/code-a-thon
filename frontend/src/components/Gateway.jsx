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

  return (
    <div className="gateway">
      <div className="gateway__brand">
        <div className="gateway__logo">Aegis AI</div>
        <div className="gateway__tagline">National Identity Protection Platform</div>
      </div>

      <div className="gateway__gates">
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

      <div className="gateway__hint">
        {showExec ? 'Executive node active' : 'Secure access layer — Select your identity vector'}
      </div>
    </div>
  );
}
