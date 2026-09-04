import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const CONVENIENCE_FEE = 30;

function BookingSummary() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const seatIds = location.state?.seatIds || [];
  const expiresAt = location.state?.expiresAt;
  const selectedSnacks = location.state?.snacks || [];

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [snackDetails, setSnackDetails] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (seatIds.length === 0) {
      navigate(`/seats/${showId}`);
      return;
    }
    Promise.all([
      api.get(`/shows/${showId}/`),
      api.get(`/shows/${showId}/seats/`),
      api.get('/snacks/')
    ]).then(([showRes, seatsRes, snacksRes]) => {
      setShow(showRes.data);
      setSeats(seatsRes.data.filter(s => seatIds.includes(s.seat)));

      const enriched = selectedSnacks.map(item => {
        const snack = snacksRes.data.find(s => s.id === item.snack_id);
        return snack ? { ...item, name: snack.name, price: snack.price } : null;
      }).filter(Boolean);
      setSnackDetails(enriched);
    }).catch(() => setError('Unable to load booking details.'));
  }, [showId, navigate, seatIds, selectedSnacks]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleConfirm = async () => {
    setCreating(true);
    setError('');
    try {
      const showSeatIds = seats.map(s => s.id);
      const res = await api.post('/bookings/', {
        show_id: showId,
        show_seat_ids: showSeatIds,
        snacks: selectedSnacks,
      });
      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create booking.');
    } finally {
      setCreating(false);
    }
  };

  if (!show) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '520px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: 'var(--space-xl)' }}></div>
      <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }}></div>
    </div>
  );

  const ticketTotal = show.price * seats.length;
  const snackTotal = snackDetails.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const grandTotal = ticketTotal + snackTotal + CONVENIENCE_FEE;
  const expired = remaining === 0;
  const mins = remaining !== null ? Math.floor(remaining / 60) : null;
  const secs = remaining !== null ? remaining % 60 : null;
  const isExpiringSoon = remaining !== null && remaining < 60;

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) var(--space-lg)', maxWidth: '560px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>Booking Summary</h1>
      
      {remaining !== null && !expired && (
        <p style={{ 
          color: isExpiringSoon ? 'var(--accent-red)' : 'var(--text-muted)', 
          fontSize: '14px', 
          marginBottom: 'var(--space-lg)',
          fontWeight: isExpiringSoon ? 600 : 400,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {isExpiringSoon && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 1s infinite' }}></span>}
          Seats held for: {mins}:{secs.toString().padStart(2, '0')}
        </p>
      )}
      {expired && (
        <div style={{ 
          background: 'rgba(224, 38, 63, 0.1)', border: '1px solid var(--accent-red)',
          color: 'var(--accent-red)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)', fontSize: '14px' 
        }}>
          Your seat hold has expired. <Link to={`/seats/${showId}`} style={{ color: 'white', fontWeight: 600, textDecoration: 'underline' }}>Select seats again</Link>
        </div>
      )}

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontWeight: 700, fontSize: '24px', color: 'var(--text-main)', marginBottom: 'var(--space-xs)' }}>{show.movie_title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '4px' }}>{show.theatre_name} &bull; {show.screen_name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{new Date(show.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} &bull; {show.start_time}</div>
        </div>

        <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ marginBottom: 'var(--space-sm)', fontSize: '15px', color: 'var(--text-main)', fontWeight: 500 }}>
            Seats: {seats.map(s => `${s.seat_row}${s.seat_number}`).join(', ')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span>{seats.length} ticket(s) × ₹{show.price}</span>
            <span>₹{ticketTotal.toFixed(2)}</span>
          </div>
        </div>

        {snackDetails.length > 0 && (
          <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '1px' }}>Food & Beverages</div>
            {snackDetails.map(s => (
              <div key={s.snack_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: 'var(--space-sm)', color: 'var(--text-main)' }}>
                <span>{s.quantity} × {s.name}</span>
                <span>₹{(s.price * s.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>
              <span>Snacks Total</span>
              <span>₹{snackTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span>Convenience Fee</span>
            <span>₹{CONVENIENCE_FEE.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '24px', color: 'var(--accent-red)' }}>
          <span>Total Payable</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div style={{ color: 'white', background: 'var(--accent-red)', marginTop: 'var(--space-lg)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <button onClick={handleConfirm} disabled={creating || expired} className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-xl)', padding: '16px', fontSize: '16px' }}>
        {creating ? 'Processing...' : `Proceed to Payment (₹${grandTotal.toFixed(2)})`}
      </button>
    </div>
  );
}

export default BookingSummary;