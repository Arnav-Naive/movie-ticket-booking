import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get(`/bookings/admin/all/?${params}`).then(res => setBookings(res.data)).catch(() => {});
  }, [statusFilter, search]);

  const statusColor = (status) => ({
    PENDING: '#e0a800', CONFIRMED: '#2ecc71', CANCELLED: '#888', EXPIRED: '#888'
  }[status] || 'var(--text-dim)');

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>All Bookings</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input className="input-field" placeholder="Search booking reference..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {bookings.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', padding: '16px' }}>No bookings match.</p>
        ) : bookings.map((b, i) => (
          <div key={b.id} style={{
            padding: '12px 16px', borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex', justifyContent: 'space-between', fontSize: '13px'
          }}>
            <div>
              <strong>{b.booking_reference}</strong> · {b.movie_title} · {b.username} · ₹{b.total_amount}
            </div>
            <span style={{ color: statusColor(b.status) }}>{b.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBookings;