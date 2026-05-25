import React, { useState, useEffect, useMemo } from 'react';

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [pendingCases, setPendingCases] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const fetchAll = () => {
    fetch('/api/cases/summary').then(r => r.json()).then(d => { setSummary(d); setLoadingSummary(false); }).catch(() => setLoadingSummary(false));
    fetch('/api/cases/list?pipeline_status=PENDING_EXEC_SIGN').then(r => r.json()).then(d => { setPendingCases(d); setLoadingPending(false); }).catch(() => setLoadingPending(false));
    fetch('/api/audit-logs').then(r => r.json()).then(d => { setAudits(d); setLoadingAudits(false); }).catch(() => setLoadingAudits(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Executive Authorize ──
  const handleAuthorize = async (c) => {
    try {
      const res = await fetch(`/api/cases/${c.id}/authorize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Director-S' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionMsg({ type: 'danger', msg: data.detail || 'Authorization failed' }); return; }
      setActionMsg({ type: 'success', msg: `${data.case_number} authorized → APPROVED` });
      setPendingCases(prev => prev.filter(x => x.id !== c.id));
      // Refresh summary + audits
      fetch('/api/cases/summary').then(r => r.json()).then(setSummary);
      fetch('/api/audit-logs').then(r => r.json()).then(setAudits);
    } catch { setActionMsg({ type: 'danger', msg: 'Network error' }); }
  };

  const handleReject = async (c) => {
    try {
      const res = await fetch(`/api/cases/${c.id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Director-S' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionMsg({ type: 'danger', msg: data.detail || 'Rejection failed' }); return; }
      setActionMsg({ type: 'warn', msg: `${data.case_number} rejected` });
      setPendingCases(prev => prev.filter(x => x.id !== c.id));
      fetch('/api/cases/summary').then(r => r.json()).then(setSummary);
      fetch('/api/audit-logs').then(r => r.json()).then(setAudits);
    } catch { setActionMsg({ type: 'danger', msg: 'Network error' }); }
  };

  const filtered = useMemo(() => {
    if (!search) return audits;
    const t = search.toLowerCase();
    return audits.filter(r => r.admin.toLowerCase().includes(t) || r.action.toLowerCase().includes(t) || r.ip.includes(t));
  }, [search, audits]);

  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return iso; } };

  const chartW = 800, chartH = 160;
  const points = useMemo(() => {
    const count = 20; const pts = []; const base = summary ? summary.total_cases * 3 : 30;
    for (let i = 0; i <= count; i++) { const x = (i / count) * chartW; const y = chartH - 20 - (Math.sin(i * 0.5 + 1) * 0.4 + 0.5) * (base + Math.sin(i * 0.3) * 20 + i * 2); pts.push({ x, y: Math.max(10, Math.min(chartH - 10, y)) }); }
    return pts;
  }, [summary]);
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${chartW} ${chartH} L 0 ${chartH} Z`;

  return (
    <div className="page">
      {actionMsg && (
        <div className={`alert alert--${actionMsg.type} mb-16`} style={{ animation: 'fadeUp 300ms ease' }}>{actionMsg.msg}</div>
      )}

      {/* KPI Row */}
      <div className="grid-3 mb-20">
        {loadingSummary ? (
          <>{[1,2,3].map(i => <div key={i} className="kpi"><div className="loading"><div className="spinner" /></div></div>)}</>
        ) : summary ? (
          <>
            <div className="kpi">
              <div className="kpi__label">Active Investigations</div>
              <div className="kpi__value">{summary.active_investigations}</div>
              <div className="kpi__trend kpi__trend--up">{summary.total_cases} total · {summary.approved_count} approved</div>
              <div className="kpi__extra">Analyst queue: {summary.analyst_queue} · Exec queue: {summary.exec_queue}</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Urgent Threat Signatures</div>
              <div className="kpi__value">{summary.critical_threats}</div>
              <div className="kpi__trend kpi__trend--down">{summary.rejected_count} rejected cases</div>
              <div className="kpi__extra">
                <span className={`badge badge--${summary.system_status === 'optimal' ? 'success' : 'warn'}`}>{summary.system_status}</span>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Auth System Rate</div>
              <div className="kpi__value">{summary.auth_success_count}</div>
              <div className="kpi__trend kpi__trend--up">successful authentications</div>
              <div className="kpi__extra">Pipeline ingestion: {summary.ingestion_count}</div>
            </div>
          </>
        ) : <div className="empty" style={{ gridColumn: '1/-1' }}>Unable to load summary.</div>}
      </div>

      {/* Pending Executive Authorization */}
      <div className="card mb-20">
        <div className="card__head">
          <span className="card__title">Pending Executive Authorization</span>
          <span className="badge badge--pending badge--pipeline">{pendingCases.length} PENDING_EXEC_SIGN</span>
        </div>
        {/* Pipeline Phase Indicator */}
        <div className="pipeline-phase mb-16">
          <div className="pipeline-dot pipeline-dot--done" />
          <div className="pipeline-line pipeline-line--done" />
          <div className="pipeline-dot pipeline-dot--done" />
          <div className="pipeline-line pipeline-line--done" />
          <div className="pipeline-dot pipeline-dot--active" />
          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-4)' }}>Phase 3: Executive Authorization</span>
        </div>

        {loadingPending ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : pendingCases.length === 0 ? (
          <div className="empty">No cases pending executive sign-off.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Case</th><th>Title</th><th>Threat</th><th>Verified By</th><th>AI Trust</th><th>Action</th></tr></thead>
            <tbody>
              {pendingCases.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600 }}>{c.case_number}</td>
                  <td>{c.title}</td>
                  <td><span className={`badge badge--${c.threat_level === 'critical' ? 'danger' : c.threat_level === 'high' ? 'warn' : 'info'}`}>{c.threat_level}</span></td>
                  <td style={{ fontSize: '12px' }}>{c.verified_by || '—'}</td>
                  <td>
                    <span className={`badge badge--${c.ai_trust_metric < 0.4 ? 'danger' : c.ai_trust_metric < 0.7 ? 'warn' : 'success'}`}>
                      {(c.ai_trust_metric * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn--success btn--sm" onClick={() => handleAuthorize(c)}>Authorize</button>
                      <button className="btn btn--danger btn--sm" onClick={() => handleReject(c)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Scan Activity Chart */}
      <div className="chart mb-20">
        <div className="chart__head">
          <span className="chart__title">National Scan Activity</span>
          <div className="chart__legend">
            <div className="chart__legend-item"><div className="chart__dot" style={{ background: 'var(--accent)' }} /> Current</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} style={{ width: '100%', height: '180px' }} preserveAspectRatio="none">
          <defs><linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" /></linearGradient></defs>
          {[0.25, 0.5, 0.75].map((p, i) => <line key={i} x1="0" y1={chartH * p} x2={chartW} y2={chartH * p} stroke="var(--border-light)" strokeWidth="1" />)}
          <path d={areaPath} fill="url(#aFill)" />
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Audit Trail */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Infrastructure Access Logs</span>
          <input className="input" placeholder="Filter logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '220px' }} />
        </div>
        {loadingAudits ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">{search ? `No results for "${search}"` : 'No audit logs.'}</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>IP</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{fmtDate(row.created_at)}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>{row.admin}</td>
                  <td>{row.action}{row.version && <span className="badge badge--info" style={{ marginLeft: '6px' }}>{row.version}</span>}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{row.ip}</td>
                  <td><span className={`badge badge--${row.status === 'success' ? 'success' : 'warn'}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
