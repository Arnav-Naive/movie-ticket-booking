import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'POPCORN', label: '🍿 Popcorn' },
  { key: 'BEVERAGE', label: '🥤 Beverages' },
  { key: 'SNACK', label: '🌮 Snacks' },
  { key: 'COMBO', label: '🎁 Combos' },
];

function Snacks() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const seatIds = location.state?.seatIds || [];
  const expiresAt = location.state?.expiresAt;

  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({}); // { snackId: qty }
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    if (seatIds.length === 0) {
      navigate(`/seats/${showId}`);
      return;
    }
    api.get('/snacks/')
      .then(res => setSnacks(res.data))
      .finally(() => setLoading(false));
  }, [showId]);

  const setQty = (snackId, qty) => {
    setQuantities(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[snackId];
      else next[snackId] = qty;
      return next;
    });
  };

  const filtered = activeCategory === 'ALL' ? snacks : snacks.filter(s => s.category === activeCategory);
  const snackTotal = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const snack = snacks.find(s => s.id === Number(id));
    return sum + (snack ? snack.price * qty : 0);
  }, 0);

  const proceed = () => {
    const selectedSnacks = Object.entries(quantities).map(([id, qty]) => ({
      snack_id: Number(id),
      quantity: qty,
    }));
    navigate(`/summary/${showId}`, { state: { seatIds, expiresAt, snacks: selectedSnacks } });
  };

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading snacks...</div>;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ marginBottom: '8px' }}>Snacks & Combos</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '24px' }}>Optional — skip if you don't want anything.</p>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
              border: `1px solid ${activeCategory === c.key ? 'var(--red)' : 'var(--border)'}`,
              background: activeCategory === c.key ? 'var(--red)' : 'var(--card)',
              color: activeCategory === c.key ? 'white' : 'var(--text-dim)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>No items in this category.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px', marginBottom: '100px' }}>
          {filtered.map(snack => {
            const qty = quantities[snack.id] || 0;
            return (
              <div key={snack.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                {snack.image && (
                  <img src={snack.image} alt={snack.name} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
                <div style={{ fontWeight: 600 }}>{snack.name}</div>
                {snack.description && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{snack.description}</div>}
                <div style={{ fontWeight: 700, color: 'var(--red)' }}>₹{snack.price}</div>

                {qty === 0 ? (
                  <button onClick={() => setQty(snack.id, 1)} className="btn-primary" style={{ padding: '8px', fontSize: '13px' }}>
                    Add
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                    <button onClick={() => setQty(snack.id, qty - 1)} className="btn-ghost" style={{ width: '32px', height: '32px', padding: 0 }}>−</button>
                    <span style={{ fontWeight: 600 }}>{qty}</span>
                    <button onClick={() => setQty(snack.id, qty + 1)} className="btn-ghost" style={{ width: '32px', height: '32px', padding: 0 }}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)',
        borderTop: '1px solid var(--border)', padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', zIndex: 40
      }}>
        <div style={{ fontWeight: 600 }}>Snacks Total: ₹{snackTotal.toFixed(2)}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={proceed} className="btn-ghost">Skip Snacks</button>
          <button onClick={proceed} className="btn-primary">Continue to Summary</button>
        </div>
      </div>
    </div>
  );
}

export default Snacks;