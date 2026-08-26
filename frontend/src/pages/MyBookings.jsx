import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings/my/')
      .then(res => setBookings(res.data))
      .catch(() => setError('Unable to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  const statusColor = (status) => ({
    PENDING: '#e0a800', CONFIRMED: '#2ecc71', CANCELLED: '#888', EXPIRED: '#888'
  }[status] || 'var(--text-dim)');

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ marginBottom: '24px' }}>My Bookings</h1>
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>You have no bookings yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map(b => (
            <div key={b.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.movie_title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                  {b.booking_reference} · ₹{b.total_amount} ·{' '}
                  <span style={{ color: statusColor(b.status) }}>{b.status}</span>
                </div>
              </div>
              {b.status === 'CONFIRMED' && (
                <Link to={`/ticket/${b.id}`} style={{
                  background: 'var(--red)', color: 'white', padding: '8px 18px',
                  borderRadius: '6px', fontWeight: 600
                }}>
                  View Ticket
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;