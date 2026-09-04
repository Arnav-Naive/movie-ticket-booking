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
    <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--accent-red)', marginBottom: 'var(--space-md)' }}>{error}</p>
      <Link to="/my-bookings" className="btn btn-ghost">Check My Bookings</Link>
    </div>
  );

  if (!ticket) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
      <div className="skeleton" style={{ width: '360px', height: '600px', margin: '0 auto', borderRadius: 'var(--radius-lg)' }}></div>
    </div>
  );

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--bg-card)', 
        borderRadius: '16px',
        maxWidth: '420px', 
        width: '100%', 
        textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ background: 'var(--accent-red)', color: 'white', padding: 'var(--space-md) var(--space-lg)' }}>
          <div style={{ fontWeight: 800, letterSpacing: '2px', fontSize: '13px' }}>BOOKING CONFIRMED</div>
        </div>
        
        <div style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 'var(--space-xs)', color: 'var(--text-main)', lineHeight: 1.2 }}>{ticket.movie_title}</h2>
          
          <div style={{ margin: 'var(--space-xl) auto', background: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <img src={ticket.qr_code} alt="Ticket QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--space-xl)' }}>Scan this QR code at the cinema entrance</p>

          <div style={{ 
            textAlign: 'left', 
            borderTop: '2px dashed var(--border-subtle)', 
            paddingTop: 'var(--space-xl)', 
            color: 'var(--text-muted)', 
            fontSize: '15px' 
          }}>
            <div style={{ marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Reference</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'monospace', fontSize: '16px' }}>{ticket.booking_reference}</span>
            </div>
            
            <div style={{ marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Seats</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{ticket.booking_seats.map(s => `${s.seat_row}${s.seat_number}`).join(', ')}</span>
            </div>
            
            {ticket.booking_snacks?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ display: 'block', marginBottom: '4px' }}>Food & Beverages</span>
                {ticket.booking_snacks.map(s => (
                  <div key={s.id} style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'right' }}>{s.quantity} × {s.snack_name}</div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-lg)' }}>
              <span>Amount Paid</span>
              <span style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '18px' }}>₹{ticket.total_amount}</span>
            </div>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <Link to="/my-bookings" style={{
            display: 'block', padding: 'var(--space-md)', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none', transition: 'background var(--transition-fast)'
          }} className="hover-bg-border">
            View My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Ticket;