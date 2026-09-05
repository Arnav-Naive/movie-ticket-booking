import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function SeatSelection() {
  const { showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [findCount, setFindCount] = useState(2);
  const [finding, setFinding] = useState(false);
  const [findMessage, setFindMessage] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get(`/shows/${showId}/seats/`)
      .then(res => setSeats(res.data))
      .catch(() => setError('Unable to load seats.'))
      .finally(() => setLoading(false));
  }, [showId, user]);

  const toggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected(prev =>
      prev.includes(seat.seat) ? prev.filter(s => s !== seat.seat) : [...prev, seat.seat]
    );
  };

  const handleFindSeats = async () => {
    setFinding(true);
    setFindMessage('');
    try {
      const res = await api.post(`/shows/${showId}/find-seats/`, { count: findCount });
      const matched = seats.filter(s => res.data.show_seat_ids.includes(s.id));
      setSelected(matched.map(s => s.seat));
      setFindMessage(res.data.message
        ? `${res.data.message}: ${res.data.recommended_seats.join(', ')}`
        : `Best seats found: ${res.data.recommended_seats.join(', ')}`);
    } catch (err) {
      setFindMessage(err.response?.data?.error || 'Unable to find seats.');
    } finally {
      setFinding(false);
    }
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setHolding(true);
    setError('');
    try {
      const res = await api.post(`/shows/${showId}/hold-seats/`, { seat_ids: selected });
      navigate(`/snacks/${showId}`, { state: { seatIds: selected, expiresAt: res.data.expires_at } });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to hold seats.');
    } finally {
      setHolding(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
      <div className="skeleton" style={{ width: '200px', height: '40px', margin: '0 auto var(--space-xl)' }}></div>
      <div className="skeleton" style={{ width: '80%', maxWidth: '600px', height: '300px', margin: '0 auto' }}></div>
    </div>
  );

  const rows = [...new Set(seats.map(s => s.seat_row))].sort();

  return (
    <div className="container" style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Select Your Seats</h1>
        <p style={{ color: 'var(--text-muted)' }}>Choose exactly where you want to sit</p>
      </div>

      <div className="card" style={{ 
        display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-md)', margin: '0 auto var(--space-xl)', flexWrap: 'wrap', maxWidth: '600px',
        background: 'var(--bg-surface)'
      }}>
        <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>Need seats together?</span>
        <select
          value={findCount}
          onChange={(e) => setFindCount(Number(e.target.value))}
          className="input-field"
          style={{ width: 'auto', padding: '8px 12px', minWidth: '100px' }}
        >
          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}
        </select>
        <button onClick={handleFindSeats} disabled={finding} className="btn btn-ghost" style={{ padding: '8px 16px' }}>
          {finding ? 'Searching...' : 'Auto-Find Seats'}
        </button>
      </div>
      
      {findMessage && (
        <div style={{ 
          textAlign: 'center', color: 'var(--success)', fontSize: '14px', fontWeight: 500, 
          marginBottom: 'var(--space-xl)', background: 'rgba(46, 204, 113, 0.1)', 
          padding: '8px 16px', borderRadius: 'var(--radius-md)', maxWidth: '600px', margin: '0 auto var(--space-xl)'
        }}>
          {findMessage}
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: 'white', background: 'var(--accent-red)', marginBottom: 'var(--space-xl)', 
          textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-md)', maxWidth: '600px', margin: '0 auto var(--space-xl)' 
        }}>
          {error}
        </div>
      )}

      {/* Screen container */}
      <div style={{ 
        textAlign: 'center', color: 'var(--text-muted)', margin: '0 auto var(--space-2xl)',
        position: 'relative', width: '100%', maxWidth: '800px', perspective: '800px'
      }}>
        <div style={{
          height: '40px',
          background: 'linear-gradient(to bottom, rgba(224,38,63,0.5) 0%, rgba(224,38,63,0) 100%)',
          transform: 'rotateX(-45deg)',
          borderRadius: '4px',
          boxShadow: '0 -10px 20px rgba(224,38,63,0.2)',
          marginBottom: 'var(--space-sm)'
        }}></div>
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Screen</span>
      </div>

      {/* Seat Map */}
      <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-lg)', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', minWidth: 'max-content', margin: '0 auto' }}>
          {rows.map(row => (
            <div key={row} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ width: '24px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{row}</span>
              {seats.filter(s => s.seat_row === row).map(seat => {
                const isSelected = selected.includes(seat.seat);
                const isAvailable = seat.status === 'AVAILABLE';
                
                let bgColor = '#2a2f3a'; // Unavailable
                let borderColor = 'transparent';
                let color = '#555';
                let shadow = 'none';

                if (isAvailable) {
                  bgColor = 'var(--bg-card)';
                  borderColor = 'var(--border-subtle)';
                  color = 'var(--text-main)';
                }
                if (isSelected) {
                  bgColor = 'var(--accent-red)';
                  borderColor = 'var(--accent-red)';
                  color = 'white';
                  shadow = 'var(--shadow-glow)';
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    disabled={!isAvailable}
                    style={{
                      width: '40px', height: '40px', 
                      borderRadius: '8px 8px 4px 4px', // Seat shape
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      color: color,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      fontSize: '12px', fontWeight: 600, flexShrink: 0,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: shadow,
                      transform: isSelected ? 'scale(1.05) translateY(-2px)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if(isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--accent-red)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if(isAvailable && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                    title={`${seat.seat_row}${seat.seat_number} - ₹${seat.price} (${seat.seat_type})`}
                  >
                    {seat.seat_number}
                  </button>
                );
              })}
              <span style={{ width: '24px' }}></span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ 
        display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', 
        padding: 'var(--space-md)', fontSize: '13px', color: 'var(--text-muted)', 
        flexWrap: 'wrap', maxWidth: '400px', margin: '0 auto var(--space-xl)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}></div>
          Available
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--accent-red)', boxShadow: 'var(--shadow-glow)' }}></div>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#2a2f3a' }}></div>
          Booked/Held
        </div>
      </div>

      {/* Action Bar */}
      <div className="card" style={{ 
        padding: 'var(--space-lg)', 
        position: 'sticky', bottom: 'var(--space-md)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        flexWrap: 'wrap', gap: 'var(--space-md)', zIndex: 10,
        background: 'rgba(23, 29, 43, 0.95)', backdropFilter: 'blur(10px)'
      }}>
        <div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Selected Seats
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
            {selected.length} seat(s)
          </div>
        </div>
        <button onClick={handleContinue} disabled={selected.length === 0 || holding} className="btn btn-primary" style={{ padding: '12px 32px', minWidth: '180px' }}>
          {holding ? 'Holding seats...' : 'Continue to Snacks'}
        </button>
      </div>
    </div>
  );
}

export default SeatSelection;