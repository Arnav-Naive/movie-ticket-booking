import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function Ticket() {
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}/ticket/`)
      .then(res => setTicket(res.data))
      .catch(() => setError('Unable to load ticket. Payment may still be processing.'))
      .finally(() => {});
  }, [bookingId]);

  if (error) return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
      <p>{error}</p>
      <Link to="/my-bookings" style={{ color: 'var(--red)' }}>Check My Bookings</Link>
    </div>
  );

  if (!ticket) return <div className="container" style={{ padding: '60px 0' }}>Loading ticket...</div>;

  return (
    <div className="container" style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center'
      }}>
        <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: '8px' }}>BOOKING CONFIRMED</div>
        <h2 style={{ marginBottom: '20px' }}>{ticket.movie_title}</h2>

        <img src={ticket.qr_code} alt="Ticket QR Code" style={{ width: '180px', margin: '0 auto 20px' }} />

        <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '16px', color: 'var(--text-dim)', fontSize: '14px' }}>
          <div style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--text)' }}>Reference:</strong> {ticket.booking_reference}</div>
          <div style={{ marginBottom: '6px' }}>
            <strong style={{ color: 'var(--text)' }}>Seats:</strong> {ticket.booking_seats.map(s => `${s.seat_row}${s.seat_number}`).join(', ')}
          </div>
          {ticket.booking_snacks?.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text)' }}>🍿 Food & Beverages:</strong>
              {ticket.booking_snacks.map(s => (
                <div key={s.id} style={{ marginLeft: '8px' }}>{s.quantity} × {s.snack_name}</div>
              ))}
            </div>
          )}
          <div><strong style={{ color: 'var(--text)' }}>Amount:</strong> ₹{ticket.total_amount}</div>
        </div>

        <Link to="/my-bookings" style={{
          display: 'block', marginTop: '24px', color: 'var(--red)', fontWeight: 600
        }}>
          View My Bookings
        </Link>
      </div>
    </div>
  );
}

export default Ticket;