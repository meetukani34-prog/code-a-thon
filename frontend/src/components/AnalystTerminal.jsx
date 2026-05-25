import React, { useState, useEffect } from 'react';

export default function AnalystTerminal() {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [evaporating, setEvaporating] = useState(null); // case id being evaporated
  const [actionMsg, setActionMsg] = useState(null);

  // ── Fetch case queue: only ANALYST_QUEUE cases for this tier ──
  const fetchCases = () => {
    setLoadingCases(true);
    fetch('/api/cases/list?pipeline_status=ANALYST_QUEUE')
      .then(r => r.json())
      .then(data => { setCases(data); setLoadingCases(false); if (data.length > 0 && !selectedId) { setSelectedId(data[0].id); setSelectedCase(data[0]); } })
      .catch(() => setLoadingCases(false));
  };

  useEffect(() => { fetchCases(); }, []);

  useEffect(() => {
    fetch('/api/fraud-graph').then(r => r.json()).then(data => { setGraphData(data); setLoadingGraph(false); }).catch(() => setLoadingGraph(false));
  }, []);

  const selectCase = (c) => {
    setSelectedId(c.id);
    fetch(`/api/cases/${c.id}`).then(r => r.json()).then(setSelectedCase).catch(() => setSelectedCase(c));
  };

  // ── Analyst Verify: evaporate card, transition state ──
  const handleVerify = async () => {
    if (!selectedCase) return;
    setEvaporating(selectedCase.id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Analyst Priya' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionMsg({ type: 'danger', msg: data.detail || 'Transition failed' }); setEvaporating(null); return; }
      setActionMsg({ type: 'success', msg: `${data.case_number} verified → ${data.new_status}` });
      // Wait for evaporation animation, then remove from list
      setTimeout(() => {
        setCases(prev => prev.filter(c => c.id !== selectedCase.id));
        setSelectedCase(null);
        setSelectedId(null);
        setEvaporating(null);
        // Auto-select next case
        setCases(prev => { if (prev.length > 0) { setSelectedId(prev[0].id); setSelectedCase(prev[0]); } return prev; });
      }, 500);
    } catch { setActionMsg({ type: 'danger', msg: 'Network error' }); setEvaporating(null); }
  };

  const handleReject = async () => {
    if (!selectedCase) return;
    setEvaporating(selectedCase.id);
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Analyst Priya' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionMsg({ type: 'danger', msg: data.detail || 'Rejection failed' }); setEvaporating(null); return; }
      setActionMsg({ type: 'warn', msg: `${data.case_number} rejected` });
      setTimeout(() => {
        setCases(prev => prev.filter(c => c.id !== selectedCase.id));
        setSelectedCase(null); setSelectedId(null); setEvaporating(null);
        setCases(prev => { if (prev.length > 0) { setSelectedId(prev[0].id); setSelectedCase(prev[0]); } return prev; });
      }, 500);
    } catch { setActionMsg({ type: 'danger', msg: 'Network error' }); setEvaporating(null); }
  };

  const threatBadge = (l) => ({ critical: 'danger', high: 'warn', medium: 'info', low: 'neutral' }[l] || 'neutral');
  const barColor = (v) => v > 75 ? 'var(--success)' : v > 40 ? 'var(--warn)' : 'var(--danger)';
  const pipelineBadge = (s) => ({ INGESTION: 'ingestion', ANALYST_QUEUE: 'queue', VERIFIED_BY_ANALYST: 'verified', PENDING_EXEC_SIGN: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }[s] || 'neutral');
  const findNode = (id) => graphData?.nodes?.find(n => n.id === id);

  const hasAnomaly = selectedCase && selectedCase.font_consistency < 30;

  return (
    <div className="page--wide">
      {/* ── Sidebar: Case Queue ── */}
      <div className="sidebar">
        <div className="sidebar__title">
          Analyst Queue
          <span style={{ color: 'var(--warn-text)' }}>{cases.length}</span>
        </div>

        {loadingCases ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : cases.length === 0 ? (
          <div className="empty">No cases in analyst queue.</div>
        ) : (
          cases.map(c => (
            <div
              key={c.id}
              className={`case-item ${selectedId === c.id ? 'case-item--active' : ''} ${evaporating === c.id ? 'case-item--evaporating' : ''}`}
              onClick={() => selectCase(c)}
            >
              <div className="case-item__top">
                <span className="case-item__num">{c.case_number}</span>
                <span className={`badge badge--${threatBadge(c.threat_level)}`}>{c.threat_level}</span>
              </div>
              <div className="case-item__title">{c.title}</div>
              <div className="case-item__desc">{c.description?.slice(0, 55)}...</div>
              <div className="case-item__meta">
                <span className={`badge badge--pipeline badge--${pipelineBadge(c.pipeline_status)}`}>{c.pipeline_status}</span>
                <span className="badge badge--neutral">{c.tenant_type}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Main: Case Detail ── */}
      <div className="flex-1">
        {actionMsg && (
          <div className={`alert alert--${actionMsg.type} mb-12`} style={{ animation: 'fadeUp 300ms ease' }}>{actionMsg.msg}</div>
        )}

        {!selectedCase ? (
          <div className="empty" style={{ marginTop: '80px' }}>Select a case from the queue to begin triage.</div>
        ) : (
          <>
            {/* Header + Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{selectedCase.case_number}: {selectedCase.title}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{selectedCase.description}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <span className={`badge badge--${threatBadge(selectedCase.threat_level)}`}>{selectedCase.threat_level}</span>
                  <span className={`badge badge--pipeline badge--${pipelineBadge(selectedCase.pipeline_status)}`}>{selectedCase.pipeline_status}</span>
                  <span className="badge badge--neutral">{selectedCase.tenant_type}</span>
                  {selectedCase.ai_trust_metric != null && (
                    <span className={`badge badge--${selectedCase.ai_trust_metric < 0.4 ? 'danger' : selectedCase.ai_trust_metric < 0.7 ? 'warn' : 'success'}`}>
                      Trust: {(selectedCase.ai_trust_metric * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn--success btn--sm" onClick={handleVerify}>Verify ✓</button>
                <button className="btn btn--danger btn--sm" onClick={handleReject}>Reject ✗</button>
              </div>
            </div>

            {/* Pipeline Phase Indicator */}
            <div className="pipeline-phase mb-16">
              <div className="pipeline-dot pipeline-dot--done" />
              <div className="pipeline-line pipeline-line--done" />
              <div className="pipeline-dot pipeline-dot--active" />
              <div className="pipeline-line" />
              <div className="pipeline-dot" />
              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-4)' }}>Phase 2: Analyst Audit</span>
            </div>

            {/* Anomaly Alert */}
            {hasAnomaly && (
              <div className="alert alert--danger mb-16">
                Anomaly Detected: Document Number Mismatch [FONT_MISMATCH] — Font consistency at {selectedCase.font_consistency}%
              </div>
            )}

            {/* Document + OCR */}
            <div className="grid-2 mb-20">
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                {selectedCase.document_url ? (
                  <img src={selectedCase.document_url} alt="Doc" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-4)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>□</div>
                    <div style={{ fontSize: '12px' }}>Document Under Analysis</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', marginTop: '4px' }}>{selectedCase.document_number}</div>
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card__head"><span className="card__title">OCR Extraction</span></div>
                {[['Document Type', selectedCase.document_type], ['Surname', selectedCase.surname], ['Given Names', selectedCase.given_names], ['Issue Date', selectedCase.issue_date]].map(([k, v]) => (
                  <div className="ocr-row" key={k}>
                    <div className="ocr-row__label">{k}</div>
                    <div className="ocr-row__value">{v}</div>
                  </div>
                ))}
                <div className="ocr-row">
                  <div className="ocr-row__label">Document Number</div>
                  <div className={`ocr-row__value ${hasAnomaly ? 'ocr-row__value--danger' : ''}`}>
                    {hasAnomaly && '⚠ '}{selectedCase.document_number}{hasAnomaly && ' [FONT_MISMATCH]'}
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics + Graph */}
            <div className="grid-2">
              <div className="card">
                <div className="card__title" style={{ marginBottom: '16px' }}>Tamper Analysis Metrics</div>
                {[{ label: 'Signature Integrity', val: selectedCase.signature_integrity }, { label: 'Hologram Match', val: selectedCase.hologram_match }, { label: 'Font Consistency', val: selectedCase.font_consistency }].map(m => (
                  <div className="mbar" key={m.label}>
                    <div className="mbar__head"><span className="mbar__label">{m.label}</span><span className="mbar__val">{m.val}%</span></div>
                    <div className="mbar__track"><div className="mbar__fill" style={{ width: `${m.val}%`, background: barColor(m.val) }} /></div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card__head">
                  <span className="card__title">Identity Link Analysis</span>
                  {graphData && <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-4)' }}>{graphData.cluster_id}</span>}
                </div>
                {loadingGraph ? (
                  <div className="loading"><div className="spinner" /></div>
                ) : !graphData ? (
                  <div className="empty">Graph unavailable.</div>
                ) : (
                  <svg viewBox="0 0 400 300" style={{ width: '100%', height: '200px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                    <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="var(--danger)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--danger)" stopOpacity="0" /></radialGradient></defs>
                    {graphData.edges.map((e, i) => { const f = findNode(e.source), t = findNode(e.target); if (!f || !t) return null; return <line key={i} x1={f.cx} y1={f.cy} x2={t.cx} y2={t.cy} stroke="var(--border)" strokeWidth="1" strokeOpacity="0.5" />; })}
                    {graphData.nodes.filter(n => n.is_primary).map(n => <circle key={`g-${n.id}`} cx={n.cx} cy={n.cy} r="30" fill="url(#glow)" />)}
                    {graphData.nodes.map(n => (
                      <g key={n.id}>
                        <circle cx={n.cx} cy={n.cy} r={n.is_primary ? 14 : 6 + n.risk * 8} fill={n.is_primary ? 'var(--danger)' : n.risk > 0.6 ? 'var(--warn)' : 'var(--accent)'} opacity={n.is_primary ? 1 : 0.75} style={n.is_primary ? { animation: 'pulse 2s ease-in-out infinite' } : {}} />
                        <text x={n.cx} y={n.cy + (n.is_primary ? 26 : 20)} textAnchor="middle" fill="var(--text-4)" fontSize="9" fontFamily="var(--mono)">{n.label}</text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
