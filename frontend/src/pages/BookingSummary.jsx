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
  }, [showId]);

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

  if (!show) return <div className="container" style={{ padding: '60px 0' }}>Loading...</div>;

  const ticketTotal = show.price * seats.length;
  const snackTotal = snackDetails.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const grandTotal = ticketTotal + snackTotal + CONVENIENCE_FEE;
  const expired = remaining === 0;
  const mins = remaining !== null ? Math.floor(remaining / 60) : null;
  const secs = remaining !== null ? remaining % 60 : null;

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '520px' }}>
      <h1 style={{ marginBottom: '12px' }}>Booking Summary</h1>

      {remaining !== null && !expired && (
        <p style={{ color: remaining < 60 ? 'var(--red)' : 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>
          Seats held for: {mins}:{secs.toString().padStart(2, '0')}
        </p>
      )}
      {expired && (
        <p style={{ color: 'var(--red)', fontSize: '14px', marginBottom: '20px' }}>
          Your seat hold has expired. <Link to={`/seats/${showId}`} style={{ color: 'var(--red)', fontWeight: 600 }}>Select seats again</Link>
        </p>
      )}

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '18px' }}>{show.movie_title}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{show.theatre_name} · {show.screen_name}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{show.date} · {show.start_time}</div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px' }}>Seats: {seats.map(s => `${s.seat_row}${s.seat_number}`).join(', ')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '14px' }}>
            <span>{seats.length} ticket(s) × ₹{show.price}</span>
            <span>₹{ticketTotal}</span>
          </div>
        </div>

        {snackDetails.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>🍿 FOOD & BEVERAGES</div>
            {snackDetails.map(s => (
              <div key={s.snack_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                <span>{s.quantity} × {s.name}</span>
                <span>₹{(s.price * s.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>
              <span>Snacks Total</span>
              <span>₹{snackTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-dim)' }}>
            <span>Convenience Fee</span>
            <span>₹{CONVENIENCE_FEE}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px' }}>
          <span>Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', marginTop: '16px' }}>{error}</p>}

      <button onClick={handleConfirm} disabled={creating || expired} className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>
        {creating ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}

export default BookingSummary;