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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api.get(`/shows/${showId}/seats/`)
      .then(res => setSeats(res.data))
      .catch(() => setError('Unable to load seats.'))
      .finally(() => setLoading(false));
  }, [showId, user]);

  const toggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected(prev =>
      prev.includes(seat.seat)
        ? prev.filter(s => s !== seat.seat)
        : [...prev, seat.seat]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setHolding(true);
    setError('');
    try {
      await api.post(`/shows/${showId}/hold-seats/`, { seat_ids: selected });
      navigate(`/summary/${showId}`, { state: { seatIds: selected } });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to hold seats.');
    } finally {
      setHolding(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading seats...</div>;

  const rows = [...new Set(seats.map(s => s.seat_row))].sort();

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ marginBottom: '8px' }}>Select Seats</h1>
      <div style={{
        textAlign: 'center', color: 'var(--text-dim)', margin: '32px 0 16px',
        borderBottom: '2px solid var(--border)', paddingBottom: '8px', fontSize: '13px'
      }}>
        SCREEN THIS WAY
      </div>

      {error && <p style={{ color: 'var(--red)', marginBottom: '16px' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '32px' }}>
        {rows.map(row => (
          <div key={row} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ width: '20px', color: 'var(--text-dim)', fontSize: '13px' }}>{row}</span>
            {seats.filter(s => s.seat_row === row).map(seat => {
              const isSelected = selected.includes(seat.seat);
              const isAvailable = seat.status === 'AVAILABLE';
              return (
                <button
                  key={seat.id}
                  onClick={() => toggleSeat(seat)}
                  disabled={!isAvailable}
                  style={{
                    width: '36px', height: '36px', borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: isSelected ? 'var(--red)' : isAvailable ? 'var(--card)' : '#2a2f3a',
                    color: isAvailable ? 'var(--text)' : '#555',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    fontSize: '11px'
                  }}
                  title={`${seat.seat_row}${seat.seat_number} (${seat.seat_type})`}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '32px', fontSize: '13px', color: 'var(--text-dim)' }}>
        <span>⬜ Available</span>
        <span style={{ color: 'var(--red)' }}>⬛ Selected</span>
        <span>⬛ Booked/Held</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: '12px' }}>{selected.length} seat(s) selected</p>
        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || holding}
          style={{
            background: selected.length ? 'var(--red)' : 'var(--border)',
            color: 'white', padding: '12px 32px', borderRadius: '8px',
            fontWeight: 600, border: 'none', cursor: selected.length ? 'pointer' : 'not-allowed'
          }}
        >
          {holding ? 'Holding seats...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default SeatSelection;