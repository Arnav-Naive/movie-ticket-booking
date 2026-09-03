import { useState } from 'react';
import api from '../../services/api';

function AdminVerify() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (!token.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await api.post('/bookings/verify-ticket/', { token: token.trim() });
      setResult({ ok: true, data: res.data });
    } catch (err) {
      setResult({ ok: false, data: err.response?.data });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Verify Ticket</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
        <input
          className="input-field" placeholder="Paste QR token here"
          value={token} onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && verify()}
        />
        <button onClick={verify} disabled={checking} className="btn-primary">
          {checking ? 'Checking...' : 'Verify'}
        </button>
      </div>

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