import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['POPCORN', 'BEVERAGE', 'SNACK', 'COMBO'];

function AdminSnacks() {
  const { showToast } = useToast();
  const [snacks, setSnacks] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', category: 'SNACK', price: '', image: '', theatre: '', is_available: true
  });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api.get('/snacks/').then(res => setSnacks(res.data));
    api.get('/theatres/').then(res => setTheatres(res.data));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'SNACK', price: '', image: '', theatre: '', is_available: true });
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.name || !form.price) {
      showToast('Name and price are required', 'error');
      return;
    }
    const payload = { ...form, theatre: form.theatre || null, price: Number(form.price) };
    try {
      if (editingId) {
        await api.patch(`/snacks/${editingId}/`, payload);
        showToast('Snack updated', 'success');
      } else {
        await api.post('/snacks/', payload);
        showToast('Snack added', 'success');
      }
      resetForm();
      load();
    } catch (err) {
      showToast('Failed to save snack', 'error');
    }
  };

  const edit = (snack) => {
    setForm({
      name: snack.name, description: snack.description || '', category: snack.category,
      price: snack.price, image: snack.image || '', theatre: snack.theatre || '', is_available: snack.is_available
    });
    setEditingId(snack.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAvailable = async (snack) => {
    try {
      await api.patch(`/snacks/${snack.id}/`, { is_available: !snack.is_available });
      load();
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this snack? This will fail if it has past order history — mark it unavailable instead in that case.')) return;
    try {
      await api.delete(`/snacks/${id}/`);
      showToast('Snack deleted', 'success');
      load();
    } catch {
      showToast('Cannot delete — this snack has existing bookings. Mark it unavailable instead.', 'error');
    }
  };

  const box = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '24px' };
  const row = { display: 'flex', gap: '10px', flexWrap: 'wrap' };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Snacks & Combos</h1>

      <div style={box}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>{editingId ? 'Edit Snack' : 'Add Snack'}</h3>
        <div style={{ ...row, marginBottom: '10px' }}>
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={{ flex: 1, minWidth: '160px' }} />
          <input className="input-field" placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} style={{ width: '110px' }} />
          <select className="input-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} style={{ width: 'auto' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ ...row, marginBottom: '10px' }}>
          <input className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} style={{ flex: 1, minWidth: '160px' }} />
          <input className="input-field" placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} style={{ flex: 1, minWidth: '160px' }} />
        </div>
        <div style={{ ...row, alignItems: 'center' }}>
          <select className="input-field" value={form.theatre} onChange={(e) => setForm({...form, theatre: e.target.value})} style={{ width: 'auto' }}>
            <option value="">All theatres</option>
            {theatres.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)' }}>
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({...form, is_available: e.target.checked})} />
            Available
          </label>
          <button onClick={submit} className="btn-primary">{editingId ? 'Save Changes' : 'Add Snack'}</button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {snacks.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', padding: '16px' }}>No snacks yet.</p>
        ) : snacks.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
            borderBottom: i < snacks.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ fontSize: '13px' }}>
              <strong>{s.name}</strong> · {s.category} · ₹{s.price} · {theatres.find(t => t.id === s.theatre)?.name || 'All theatres'}
              {!s.is_available && <span style={{ color: 'var(--red)' }}> · Unavailable</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => toggleAvailable(s)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: '12px' }}>
                {s.is_available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button onClick={() => edit(s)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: '12px' }}>Edit</button>
              <button onClick={() => remove(s.id)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: '12px', borderColor: 'var(--red)', color: 'var(--red)' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSnacks;