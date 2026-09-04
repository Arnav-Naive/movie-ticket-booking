import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

function MyBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadBookings = () => {
    api.get('/bookings/my/')
      .then(res => setBookings(res.data))
      .catch(() => setError('Unable to load bookings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  const doCancel = async (bookingId) => {
    setConfirmTarget(null);
    setCancellingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel/`);
      showToast('Booking cancelled. Refund (test mode) will be processed shortly.', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

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
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.movie_title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                  {b.booking_reference} · ₹{b.total_amount} ·{' '}
                  <span style={{ color: statusColor(b.status) }}>{b.status}</span>
                  {b.booking_snacks?.length > 0 && (
                    <span style={{ marginLeft: '8px', color: 'var(--text)' }}>🍿 Snacks Added</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {b.status === 'CONFIRMED' && (
                  <>
                    <Link to={`/ticket/${b.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      View Ticket
                    </Link>
                    <button
                      className="btn-ghost"
                      onClick={() => setConfirmTarget(b.id)}
                      disabled={cancellingId === b.id}
                    >
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Cancel this booking?"
        message="Your refund (test mode) will be processed shortly. This cannot be undone."
        confirmLabel="Yes, cancel"
        onConfirm={() => doCancel(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default MyBookings;