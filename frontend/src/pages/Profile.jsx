import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user) api.get('/wallet/').then(res => setWallet(res.data)).catch(() => {});
  }, [user]);

  if (!user) return <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--text-muted)' }}>Please log in to view your profile.</div>;

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '500px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-xl)' }}>My Profile</h1>
      
      <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: 'var(--radius-full)', 
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--text-muted)'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Account</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>{user.username}</div>
          {user.email && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user.email}</div>}
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)', border: '1px solid var(--accent-red)', boxShadow: '0 4px 20px rgba(224, 38, 63, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>CineRP Balance</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1 }}>
              {wallet ? `₹${wallet.balance}` : '...'}
            </div>
          </div>
          <div style={{ background: 'rgba(224, 38, 63, 0.1)', padding: '8px', borderRadius: '50%', color: 'var(--accent-red)' }}>
            🪙
          </div>
        </div>

        {wallet && wallet.transactions.length > 0 ? (
          <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-md)' }}>Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {wallet.transactions.slice(0, 8).map(t => {
                const isPositive = t.transaction_type === 'EARNED' || t.transaction_type === 'REFUNDED';
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>{t.transaction_type}</div>
                      {t.booking_reference && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {t.booking_reference}</div>}
                    </div>
                    <div style={{ color: isPositive ? 'var(--success)' : 'var(--text-main)', fontWeight: 600, fontSize: '14px' }}>
                      {isPositive ? '+' : '−'}₹{t.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '14px' }}>
            No recent transactions.
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;