import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import api from '../services/api';

function ScanTicket() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const busyRef = useRef(false);

  const handleDecoded = async (token) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setChecking(true);
    setResult(null);
    try {
      const res = await api.post('/bookings/verify-ticket/', { token });
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, data: err.response?.data });
    } finally {
      setChecking(false);
      setTimeout(() => { busyRef.current = false; }, 2000); // brief cooldown before scanning again
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    scannerRef.current = new QrScanner(
      videoRef.current,
      (res) => handleDecoded(res.data),
      { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' }
    );
    scannerRef.current.start().catch(() => setCameraError('Unable to access camera. Check browser permissions.'));

    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '480px' }}>
      <h1 style={{ marginBottom: '8px' }}>Scan Ticket</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '20px' }}>
        Point the camera at the guest's QR ticket.
      </p>

      {cameraError && <p style={{ color: 'var(--red)', marginBottom: '16px' }}>{cameraError}</p>}

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '20px' }}>
        <video ref={videoRef} style={{ width: '100%', display: 'block' }} />
      </div>

      {checking && <p style={{ color: 'var(--text-dim)' }}>Checking...</p>}

      {result && (
        <div style={{
          padding: '20px', borderRadius: '10px',
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

export default ScanTicket;