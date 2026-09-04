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
      showToast('Booking cancelled. Refund will be processed shortly.', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Unable to cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0' }}>
      <div className="skeleton" style={{ width: '200px', height: '40px', marginBottom: 'var(--space-xl)' }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }}></div>)}
      </div>
    </div>
  );
  
  if (error) return <div className="container" style={{ padding: 'var(--space-2xl) 0', color: 'var(--accent-red)' }}>{error}</div>;

  const statusColor = (status) => ({
    PENDING: 'var(--warning)', 
    CONFIRMED: 'var(--success)', 
    CANCELLED: 'var(--text-muted)', 
    EXPIRED: 'var(--text-muted)'
  }[status] || 'var(--text-muted)');

  const statusBg = (status) => ({
    PENDING: 'rgba(243, 156, 18, 0.1)', 
    CONFIRMED: 'rgba(46, 204, 113, 0.1)', 
    CANCELLED: 'rgba(154, 163, 181, 0.1)', 
    EXPIRED: 'rgba(154, 163, 181, 0.1)'
  }[status] || 'transparent');

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-xl)' }}>My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-2xl) var(--space-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎟️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: 'var(--space-lg)' }}>You have no bookings yet.</p>
          <Link to="/" className="btn btn-primary">Browse Movies</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {bookings.map(b => (
            <div key={b.id} className="card" style={{
              padding: 'var(--space-lg)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 'var(--space-md)'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px', color: 'var(--text-main)' }}>{b.movie_title}</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'monospace' }}>{b.booking_reference}</span>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14px' }}>₹{b.total_amount}</span>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ 
                    color: statusColor(b.status), 
                    background: statusBg(b.status),
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600
                  }}>
                    {b.status}
                  </span>
                  {b.booking_snacks?.length > 0 && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>🍿 Snacks</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {b.status === 'CONFIRMED' && (
                  <>
                    <Link to={`/ticket/${b.id}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                      View Ticket
                    </Link>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '8px 16px' }}
                      onClick={() => setConfirmTarget(b.id)}
                      disabled={cancellingId === b.id}
                    >
                      {cancellingId === b.id ? 'Wait...' : 'Cancel'}
                    </button>
                  </>
                )}
                {b.status === 'PENDING' && (
                  <Link to={`/payment/${b.id}`} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    Pay Now
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Cancel this booking?"
        message="Your refund will be processed shortly. This cannot be undone."
        confirmLabel="Yes, cancel"
        onConfirm={() => doCancel(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default MyBookings;