import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user) api.get('/wallet/').then(res => setWallet(res.data)).catch(() => {});
  }, [user]);

  if (!user) return <div className="container" style={{ padding: '60px 0' }}>Please log in to view your profile.</div>;

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '460px' }}>
      <h1 style={{ marginBottom: '24px' }}>My Profile</h1>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>Username</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.username}</div>
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.email || '—'}</div>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--red)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>CineRP Balance</div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--red)', marginBottom: '18px' }}>
          {wallet ? `₹${wallet.balance}` : '...'}
        </div>
        {wallet && wallet.transactions.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {wallet.transactions.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>
                    {t.transaction_type} {t.booking_reference ? `· ${t.booking_reference}` : ''}
                  </span>
                  <span style={{ color: (t.transaction_type === 'EARNED' || t.transaction_type === 'REFUNDED') ? '#2ecc71' : '#e07070' }}>
                    {(t.transaction_type === 'EARNED' || t.transaction_type === 'REFUNDED') ? '+' : '−'}₹{t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;