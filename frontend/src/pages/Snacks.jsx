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
  }, [showId, navigate, seatIds]);

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

  if (loading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0' }}>
      <div className="skeleton" style={{ width: '240px', height: '40px', marginBottom: 'var(--space-md)' }}></div>
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: '80px', height: '36px', borderRadius: 'var(--radius-full)' }}></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }}></div>)}
      </div>
    </div>
  );

  const pillStyle = (active) => ({
    padding: '8px var(--space-md)', 
    borderRadius: 'var(--radius-full)', 
    fontSize: '13px', 
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
    background: active ? 'var(--accent-red)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-muted)',
    whiteSpace: 'nowrap', 
    flexShrink: 0,
    transition: 'all var(--transition-fast)'
  });

  return (
    <div className="container" style={{ padding: 'var(--space-xl) var(--space-lg)', paddingBottom: '120px' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Snacks & Combos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Grab a bite before the movie (Optional)</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: 'var(--space-xl)', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            style={pillStyle(activeCategory === c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No items found in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
          {filtered.map(snack => {
            const qty = quantities[snack.id] || 0;
            return (
              <div key={snack.id} className="card" style={{
                display: 'flex', flexDirection: 'column', padding: 'var(--space-md)', gap: 'var(--space-sm)'
              }}>
                {snack.image ? (
                  <img src={snack.image} alt={snack.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                )}
                
                <div style={{ fontWeight: 600, fontSize: '16px', marginTop: 'var(--space-xs)' }}>{snack.name}</div>
                {snack.description && <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, flexGrow: 1 }}>{snack.description}</div>}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent-red)' }}>₹{snack.price}</div>
                  
                  {qty === 0 ? (
                    <button onClick={() => setQty(snack.id, 1)} className="btn btn-ghost" style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)' }}>
                      Add
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', padding: '4px' }}>
                      <button onClick={() => setQty(snack.id, qty - 1)} className="btn btn-primary" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minWidth: '0' }}>−</button>
                      <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{qty}</span>
                      <button onClick={() => setQty(snack.id, qty + 1)} className="btn btn-primary" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', minWidth: '0' }}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(23, 29, 43, 0.95)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-md) var(--space-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', zIndex: 40
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Snacks Total</div>
          <div style={{ fontWeight: 700, fontSize: '20px', color: 'var(--text-main)' }}>₹{snackTotal.toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {snackTotal === 0 && <button onClick={proceed} className="btn btn-ghost">Skip Snacks</button>}
          <button onClick={proceed} className="btn btn-primary">
            {snackTotal > 0 ? 'Review Booking' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Snacks;