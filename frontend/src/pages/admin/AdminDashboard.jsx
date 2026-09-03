import { useState, useEffect } from 'react';
import api from '../../services/api';

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard/').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <p style={{ color: 'var(--text-dim)' }}>Loading dashboard...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        <StatCard label="Total Movies" value={stats.total_movies} />
        <StatCard label="Total Theatres" value={stats.total_theatres} />
        <StatCard label="Total Shows" value={stats.total_shows} />
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Confirmed Bookings" value={stats.total_bookings} />
        <StatCard label="Today's Bookings" value={stats.todays_bookings} />
        <StatCard label="Total Revenue" value={`₹${stats.total_revenue}`} />
      </div>

      {stats.top_movies?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Top Movies</h2>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            {stats.top_movies.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                borderBottom: i < stats.top_movies.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span>{m.show__movie__title}</span>
                <span style={{ color: 'var(--text-dim)' }}>{m.booking_count} booking(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;