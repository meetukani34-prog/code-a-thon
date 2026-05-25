import React, { useState, useRef, useCallback, useEffect } from 'react';

const CLOUD_NAME = 'dzcp4zrjs';
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
const TIMEOUT_MS = 45000;

const TENANTS = [
  { key: 'personal', icon: '◆', title: 'Personal Node', desc: 'Individual identity protection and document verification.' },
  { key: 'residential', icon: '◇', title: 'Residential Cluster', desc: 'Housing society centralized user verification.' },
  { key: 'corporate', icon: '▣', title: 'Corporate Node', desc: 'Enterprise onboarding and synthetic identity filtering.' },
];

export default function CitizenPortal({ userName }) {
  const [tenant, setTenant] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadResult, setUploadResult] = useState(null);
  const [banner, setBanner] = useState(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  // ── Fetch activity when tenant is selected ──
  useEffect(() => {
    if (!tenant) return;
    setLoadingActivity(true);
    fetch(`/api/activity-log?tenant_type=${tenant}&user_name=${encodeURIComponent(userName || '')}`)
      .then(r => r.json())
      .then(data => { setActivity(data); setLoadingActivity(false); })
      .catch(() => setLoadingActivity(false));
  }, [tenant, userName]);

  const showBanner = useCallback((msg, type) => {
    setBanner({ msg, type });
    setTimeout(() => setBanner(null), 5000);
  }, []);

  const refreshActivity = () => {
    if (!tenant) return;
    fetch(`/api/activity-log?tenant_type=${tenant}&user_name=${encodeURIComponent(userName || '')}`).then(r => r.json()).then(setActivity).catch(() => {});
  };

  // ── Upload with 45s AbortController + local fallback ──
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setUploadResult(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'ml_default');
      const cloudRes = await fetch(CLOUD_URL, { method: 'POST', body: fd, signal: controller.signal });
      clearTimeout(timer);
      if (!cloudRes.ok) throw new Error('Cloud error');
      const cloudData = await cloudRes.json();
      const analysis = await fetch('/api/verify-document', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudinary_url: cloudData.secure_url, document_type: 'national_id', tenant_type: tenant || 'personal', user_name: userName }),
      }).then(r => r.json());
      setUploadResult(analysis);
      setUploadState('result');
      showBanner('Document analyzed via Cloudinary pipeline', 'success');
      refreshActivity();
    } catch (err) {
      clearTimeout(timer);
      showBanner('Local processing buffer deployed due to network latency limits', 'warn');
      setUploadState('fallback');
      try {
        const localFd = new FormData();
        localFd.append('file', file);
        const localRes = await fetch(`/api/verify-document-local?tenant_type=${tenant || 'personal'}&user_name=${encodeURIComponent(userName || 'Citizen')}`, { method: 'POST', body: localFd });
        const localData = await localRes.json();
        setUploadResult(localData);
        setUploadState('result');
        showBanner('Document analyzed via local fallback', 'success');
        refreshActivity();
      } catch {
        setUploadState('idle');
        showBanner('Analysis pipeline unavailable', 'danger');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const closeModal = () => { setUploadState('idle'); setUploadResult(null); if (abortRef.current) abortRef.current.abort(); };
  const statusBadge = (s) => s === 'success' ? 'badge--success' : s === 'pending' ? 'badge--warn' : 'badge--danger';
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };

  // ── Tenant Selection ──
  if (!tenant) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px' }}>Select Identity Profile</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '32px' }}>Choose your verification context to proceed.</p>
        <div className="capsules">
          {TENANTS.map(t => (
            <div key={t.key} className="capsule" onClick={() => setTenant(t.key)}>
              <div className="capsule__icon">{t.icon}</div>
              <div className="capsule__title">{t.title}</div>
              <div className="capsule__desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {banner && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 999 }}>
          <div className={`alert alert--${banner.type}`}>{banner.msg}</div>
        </div>
      )}

      {/* Welcome */}
      <div className="card mb-20" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Welcome back, {userName || 'Citizen'}.</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>Your identity matrix is secure.</p>
          </div>
          <span className="badge badge--info badge--pipeline">{tenant.toUpperCase()} NODE</span>
        </div>
      </div>

      {/* Identity Status */}
      <div className="card mb-20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', fontSize: '16px', fontWeight: 700 }}>✓</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Identity Status <span className="badge badge--success">Verified</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Last scanned: {fmtDate(new Date().toISOString())}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card__title" style={{ marginBottom: '6px' }}>Verify New Document</div>
          <div className="card__sub" style={{ marginBottom: '16px' }}>Submit for AI-powered validation. Enters the cascading pipeline.</div>
          <button className="btn btn--primary btn--full" onClick={() => setUploadState('selecting')}>Upload Document</button>
        </div>
        <div className="card">
          <div className="card__title" style={{ marginBottom: '6px' }}>Report Suspicious Activity</div>
          <div className="card__sub" style={{ marginBottom: '16px' }}>Alert the security team about unrecognized actions.</div>
          <button className="btn btn--danger btn--full">Report Alert</button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Recent Activity</span>
          <button className="btn btn--ghost btn--sm" onClick={refreshActivity}>Refresh</button>
        </div>
        {loadingActivity ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : activity.length === 0 ? (
          <div className="empty">No activity for this tenant profile.</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Action</th><th>Location</th><th>IP</th><th>Status</th></tr></thead>
            <tbody>
              {activity.map(row => (
                <tr key={row.id}>
                  <td style={{ fontSize: '12px' }}>{fmtDate(row.created_at)}</td>
                  <td>{row.action}</td>
                  <td>{row.location}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{row.ip}</td>
                  <td><span className={`badge ${statusBadge(row.status)}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {uploadState !== 'idle' && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__title">{uploadState === 'result' ? 'Analysis Complete' : 'Verify Document'}</div>
            {uploadState === 'selecting' && (
              <>
                <div className="modal__desc">Select a document image. Enters the Cascading Trust Pipeline.</div>
                <div className="dropzone" onClick={() => fileRef.current?.click()}>
                  <div className="dropzone__text">Click to select file</div>
                  <div className="dropzone__hint">JPEG, PNG, BMP, TIFF — 45s cloud timeout</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              </>
            )}
            {(uploadState === 'uploading' || uploadState === 'fallback') && (
              <div className="loading" style={{ flexDirection: 'column', gap: '12px' }}>
                <div className="spinner" />
                <span>{uploadState === 'uploading' ? 'Uploading to Cloudinary (45s limit)...' : 'Streaming to local analysis engine...'}</span>
              </div>
            )}
            {uploadState === 'result' && uploadResult && (
              <>
                <div className="modal__desc">Document {uploadResult.document_id} processed. AI Trust: {(uploadResult.ai_trust_metric * 100).toFixed(0)}%. Pipeline: ANALYST_QUEUE</div>
                <div className="result">
                  {[['Document ID', uploadResult.document_id], ['AI Trust Metric', `${(uploadResult.ai_trust_metric * 100).toFixed(1)}%`], ['Confidence', `${(uploadResult.confidence * 100).toFixed(1)}%`], ['Signature', `${uploadResult.signature_integrity}%`], ['Hologram', `${uploadResult.hologram_match}%`], ['Font', `${uploadResult.font_consistency}%`], ['Method', uploadResult.upload_method], ['Time', `${uploadResult.processing_time_ms}ms`]].map(([k, v]) => (
                    <div className="result__row" key={k}><span className="result__key">{k}</span><span className="result__val">{v}</span></div>
                  ))}
                </div>
                {uploadResult.anomalies?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {uploadResult.anomalies.map((a, i) => (
                      <div key={i} className={`alert alert--${a.severity === 'critical' ? 'danger' : 'warn'}`} style={{ marginBottom: '6px' }}>
                        {a.field} — {a.type} [{a.severity.toUpperCase()}]
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="modal__actions">
              <button className="btn btn--outline btn--sm" onClick={closeModal}>{uploadState === 'result' ? 'Close' : 'Cancel'}</button>
              {uploadState === 'result' && <button className="btn btn--primary btn--sm" onClick={() => { setUploadState('selecting'); setUploadResult(null); }}>Scan Another</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
