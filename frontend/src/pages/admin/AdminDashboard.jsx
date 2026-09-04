import { useState, useEffect } from 'react';
import api from '../../services/api';

function StatCard({ label, value, icon }) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
      <div style={{ fontSize: '32px', opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard/').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div>
      <div className="skeleton" style={{ width: '200px', height: '40px', marginBottom: 'var(--space-lg)' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }}></div>)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-xl)' }}>Dashboard Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <StatCard icon="💰" label="Total Revenue" value={`₹${stats.total_revenue}`} />
        <StatCard icon="🎟️" label="Confirmed Bookings" value={stats.total_bookings} />
        <StatCard icon="📅" label="Today's Bookings" value={stats.todays_bookings} />
        <StatCard icon="🎬" label="Total Movies" value={stats.total_movies} />
        <StatCard icon="🍿" label="Total Theatres" value={stats.total_theatres} />
        <StatCard icon="🗓️" label="Total Shows" value={stats.total_shows} />
        <StatCard icon="👥" label="Total Users" value={stats.total_users} />
      </div>

      {stats.top_movies?.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Top Performing Movies</h2>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {stats.top_movies.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                borderBottom: i < stats.top_movies.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
              }}>
                <span style={{ fontWeight: 600 }}>{m.show__movie__title}</span>
                <span style={{ color: 'var(--text-muted)' }}>{m.booking_count} booking(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;