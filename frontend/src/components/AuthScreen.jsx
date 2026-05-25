import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', aadhaar: '' });
  const [error, setError] = useState('');
  const [faceStep, setFaceStep] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | scanning | uploading | matching | success | fail
  const [faceResult, setFaceResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Format Aadhaar as XXXX-XXXX-XXXX
  const handleAadhaar = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 12);
    if (v.length > 8) v = v.slice(0, 4) + '-' + v.slice(4, 8) + '-' + v.slice(8);
    else if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4);
    update('aadhaar', v);
  };

  const rawAadhaar = () => form.aadhaar.replace(/-/g, '');

  // ── Webcam ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setCameraReady(true); }
    } catch { setError('Camera access denied. Please allow camera permissions.'); }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => { if (faceStep) startCamera(); else stopCamera(); }, [faceStep, startCamera, stopCamera]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = 640; canvas.height = 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // ── Signup: Capture → Verify face → Upload to Cloudinary via backend ──
  const handleSignupScan = async () => {
    const base64 = captureFrame();
    if (!base64) return;
    setFaceStatus('scanning'); setStatusMsg('Detecting face...');

    try {
      // Step 1: Verify face exists
      const verRes = await fetch('/api/verify-face', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_base64: base64 }) });
      const verData = await verRes.json();
      setFaceResult(verData);

      if (!verData.face_detected) {
        setFaceStatus('fail'); setStatusMsg(verData.message || 'No face detected. Move closer.');
        return;
      }

      // Step 2: Register with face data → backend uploads to Cloudinary
      setFaceStatus('uploading'); setStatusMsg('Uploading face to secure vault...');
      const regRes = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, aadhaar: rawAadhaar(), face_data: base64 }),
      });
      const regData = await regRes.json();

      if (!regRes.ok) {
        setFaceStatus('fail'); setStatusMsg(regData.detail || 'Registration failed');
        return;
      }

      setFaceStatus('success'); setStatusMsg(`Enrolled! Face stored securely.${regData.face_url ? '' : ' (local fallback)'}`);
      setTimeout(() => { stopCamera(); onAuth({ name: regData.name, email: regData.email }); }, 2000);

    } catch (err) {
      setFaceStatus('fail'); setStatusMsg('Network error. Try again.');
    }
  };

  // ── Login: Capture → Send face for matching against Cloudinary stored face ──
  const handleLoginScan = async () => {
    const base64 = captureFrame();
    if (!base64) return;
    setFaceStatus('scanning'); setStatusMsg('Detecting face...');

    try {
      // Step 1: Verify face exists locally
      const verRes = await fetch('/api/verify-face', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_base64: base64 }) });
      const verData = await verRes.json();
      setFaceResult(verData);

      if (!verData.face_detected) {
        setFaceStatus('fail'); setStatusMsg(verData.message || 'No face detected. Move closer.');
        return;
      }

      // Step 2: Login with face → backend downloads Cloudinary face and compares
      setFaceStatus('matching'); setStatusMsg('Matching face with enrolled identity...');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, aadhaar: rawAadhaar(), face_data: base64 }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setFaceStatus('fail');
        setStatusMsg(loginData.detail || 'Login failed');
        return;
      }

      setFaceResult(prev => ({ ...prev, face_match: loginData.face_match }));
      setFaceStatus('success');
      const sim = loginData.face_match?.similarity;
      setStatusMsg(`Identity verified! ${sim ? `Match: ${(sim * 100).toFixed(0)}%` : ''}`);
      setTimeout(() => { stopCamera(); onAuth({ name: loginData.name, email: loginData.email }); }, 2000);

    } catch (err) {
      setFaceStatus('fail'); setStatusMsg('Network error. Try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (!form.email || !form.password) { setError('Please fill all required fields.'); return; }
    if (rawAadhaar().length !== 12) { setError('Valid 12-digit Aadhaar number is required.'); return; }
    if (mode === 'signup') {
      if (!form.name) { setError('Full name is required.'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    }
    setFaceStep(true);
  };

  const barColor = (v) => v > 0.7 ? 'var(--success)' : v > 0.4 ? 'var(--warn)' : 'var(--danger)';

  const statusColor = {
    idle: 'rgba(255,255,255,0.3)',
    scanning: 'var(--warn)',
    uploading: 'var(--accent)',
    matching: 'var(--accent)',
    success: 'var(--success)',
    fail: 'var(--danger)',
  };

  // ── FACE VERIFICATION SCREEN ──
  if (faceStep) {
    return (
      <div className="gateway">
        <div style={{ width: '480px', maxWidth: '94vw', animation: 'fadeUp 400ms ease', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="gateway__logo">
              {mode === 'signup' ? 'Biometric Enrollment' : 'Face Authentication'}
            </div>
            <div className="gateway__tagline">
              {mode === 'signup' ? 'Your face will be securely stored on encrypted cloud vault' : 'Live face will be matched against your enrolled identity'}
            </div>
          </div>

          <div style={{ background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '24px', overflow: 'hidden' }}>
            {/* Camera Feed */}
            <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000', marginBottom: '16px' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', borderRadius: 'var(--radius)', transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Face oval guide */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{
                  width: '200px', height: '260px', borderRadius: '50%',
                  border: `3px solid ${statusColor[faceStatus]}`,
                  transition: 'border-color 300ms ease, box-shadow 300ms ease',
                  boxShadow: faceStatus === 'scanning' || faceStatus === 'matching' ? `0 0 30px ${statusColor[faceStatus]}33` : faceStatus === 'success' ? '0 0 30px rgba(34,197,94,0.3)' : 'none',
                  animation: faceStatus === 'scanning' || faceStatus === 'matching' ? 'faceScan 2s ease-in-out infinite' : 'none',
                }} />
              </div>

              {/* Status bar */}
              {faceStatus !== 'idle' && (
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', padding: '6px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '90%' }}>
                  {faceStatus !== 'success' && faceStatus !== 'fail' && <div className="spinner" style={{ width: '12px', height: '12px' }} />}
                  {faceStatus === 'success' && <span style={{ color: 'var(--success-text)' }}>✓</span>}
                  {faceStatus === 'fail' && <span style={{ color: 'var(--danger-text)' }}>✕</span>}
                  <span style={{ fontSize: '12px', color: statusColor[faceStatus], whiteSpace: 'nowrap' }}>{statusMsg}</span>
                </div>
              )}
            </div>

            {/* Aadhaar badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <span className="badge badge--info badge--pipeline" style={{ fontSize: '11px', padding: '4px 10px' }}>
                AADHAAR: XXXX-XXXX-{rawAadhaar().slice(-4) || '????'}
              </span>
            </div>

            {/* Metrics */}
            {faceResult && faceResult.face_detected && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {[
                    ['Confidence', faceResult.confidence],
                    ['Liveness', faceResult.liveness_score],
                    ['Sharpness', faceResult.metrics?.sharpness],
                    ['Texture', faceResult.metrics?.texture],
                    ...(faceResult.face_match ? [['Face Match', faceResult.face_match.similarity]] : []),
                  ].map(([label, val]) => val != null && (
                    <div key={label} style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(val, 1) * 100}%`, height: '100%', background: barColor(val), borderRadius: '2px', transition: 'width 400ms cubic-bezier(0.34,1.56,0.64,1)' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-2)', minWidth: '32px' }}>{(Math.min(val, 1) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {faceResult.processing_time_ms && (
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', textAlign: 'center' }}>
                    Processed in {faceResult.processing_time_ms}ms · Faces: {faceResult.face_count}
                    {faceResult.face_match && ` · Method: ${faceResult.face_match.method}`}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--outline btn--full" onClick={() => { setFaceStep(false); setFaceStatus('idle'); setFaceResult(null); setStatusMsg(''); stopCamera(); }}>← Back</button>
              {faceStatus !== 'success' && (
                <button className="btn btn--primary btn--full" onClick={mode === 'signup' ? handleSignupScan : handleLoginScan} disabled={!cameraReady || ['scanning', 'uploading', 'matching'].includes(faceStatus)}>
                  {faceStatus === 'scanning' ? 'Scanning...' : faceStatus === 'uploading' ? 'Uploading...' : faceStatus === 'matching' ? 'Matching...' : faceStatus === 'fail' ? 'Retry' : mode === 'signup' ? 'Capture & Enroll' : 'Capture & Verify'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LOGIN / SIGNUP FORM ──
  return (
    <div className="gateway">
      <div style={{ width: '400px', maxWidth: '92vw', animation: 'fadeUp 400ms ease', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="gateway__logo">Aegis AI</div>
          <div className="gateway__tagline">Citizen Identity Portal</div>
        </div>

        <div style={{ background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '32px 28px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '3px', marginBottom: '24px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: mode === m ? 'var(--border)' : 'transparent',
                color: mode === m ? 'var(--text-1)' : 'var(--text-3)',
                fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
              }}>
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Full Name</label>
                <input className="input" type="text" placeholder="Enter your full name" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
            )}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Aadhaar Number</label>
              <input className="input" type="text" placeholder="XXXX-XXXX-XXXX" value={form.aadhaar} onChange={handleAadhaar} style={{ fontFamily: 'var(--mono)', letterSpacing: '1px' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Email Address</label>
              <input className="input" type="email" placeholder="citizen@aegis.gov.in" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>Confirm Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
              </div>
            )}
            {error && <div className="alert alert--danger" style={{ marginBottom: '14px', fontSize: '12px', padding: '8px 12px' }}>{error}</div>}
            <button type="submit" className="btn btn--primary btn--full" style={{ marginTop: '8px', padding: '10px' }}>
              Continue to Face {mode === 'signup' ? 'Enrollment' : 'Authentication'} →
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ color: 'var(--accent-light)', cursor: 'pointer' }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </span>
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span onClick={() => onAuth(null)} style={{ fontSize: '12px', color: 'var(--text-4)', cursor: 'pointer' }} onMouseOver={e => e.target.style.color = 'var(--text-2)'} onMouseOut={e => e.target.style.color = 'var(--text-4)'}>
            ← Back to Gateway
          </span>
        </div>
      </div>
    </div>
  );
}
