import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import api from '../../services/api';

function AdminVerify() {
  const [mode, setMode] = useState('manual'); // 'manual' or 'camera'
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  const runVerify = async (tokenValue) => {
    if (!tokenValue.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await api.post('/bookings/verify-ticket/', { token: tokenValue.trim() });
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, data: err.response?.data });
    } finally {
      setChecking(false);
    }
  };

  const handleDecoded = (data) => {
    if (busyRef.current) return;
    busyRef.current = true;
    runVerify(data).finally(() => setTimeout(() => { busyRef.current = false; }, 2000));
  };

  useEffect(() => {
    if (mode !== 'camera' || !videoRef.current) return;
    scannerRef.current = new QrScanner(
      videoRef.current,
      (res) => handleDecoded(res.data),
      { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' }
    );
    scannerRef.current.start();
    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, [mode]);

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Verify Ticket</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setMode('manual')} className={mode === 'manual' ? 'btn-primary' : 'btn-ghost'}>Manual Entry</button>
        <button onClick={() => setMode('camera')} className={mode === 'camera' ? 'btn-primary' : 'btn-ghost'}>Camera Scan</button>
      </div>

      {mode === 'manual' ? (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
          <input
            className="input-field" placeholder="Paste QR token here"
            value={token} onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runVerify(token)}
          />
          <button onClick={() => runVerify(token)} disabled={checking} className="btn-primary">
            {checking ? 'Checking...' : 'Verify'}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      {checking && mode === 'camera' && <p style={{ color: 'var(--text-dim)' }}>Checking...</p>}

      {result && (
        <div style={{
          maxWidth: '420px', padding: '20px', borderRadius: '10px',
          background: result.ok && result.data.valid ? '#123626' : '#3a1620',
          border: `1px solid ${result.ok && result.data.valid ? '#2ecc71' : 'var(--red)'}`
        }}>
          {result.ok && result.data.valid ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: '10px' }}>✅ VALID TICKET</div>
              <div style={{ fontSize: '13px' }}>Reference: {result.data.booking_reference}</div>
              <div style={{ fontSize: '13px' }}>Movie: {result.data.movie}</div>
              <div style={{ fontSize: '13px' }}>Seats: {result.data.seats?.join(', ')}</div>
            </>
          ) : (
            <div style={{ fontWeight: 700 }}>
              ❌ INVALID — {result.data?.reason || result.data?.error || 'Ticket not found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminVerify;