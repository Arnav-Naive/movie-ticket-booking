import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function AdminShows() {
  const { showToast } = useToast();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [form, setForm] = useState({ movie: '', screen: '', date: '', start_time: '', price: '' });

  const load = () => {
    api.get('/shows/').then(res => setShows(res.data));
    api.get('/movies/').then(res => setMovies(res.data));
    api.get('/screens/').then(res => setScreens(res.data));
  };
  useEffect(() => { load(); }, []);

  const addShow = async () => {
    if (!form.movie || !form.screen || !form.date || !form.start_time || !form.price) {
      showToast('Fill all fields', 'error');
      return;
    }
    try {
      await api.post('/shows/', form);
      showToast('Show created', 'success');
      setForm({ movie: '', screen: '', date: '', start_time: '', price: '' });
      load();
    } catch (err) {
      showToast(err.response?.data?.[0] || 'Failed to create show', 'error');
    }
  };

  const deleteShow = async (id) => {
    if (!window.confirm('Delete this show?')) return;
    await api.delete(`/shows/${id}/`);
    showToast('Show deleted', 'success');
    load();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Shows</h1>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Create Show</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select className="input-field" value={form.movie} onChange={(e) => setForm({...form, movie: e.target.value})} style={{ width: 'auto' }}>
            <option value="">Movie...</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <select className="input-field" value={form.screen} onChange={(e) => setForm({...form, screen: e.target.value})} style={{ width: 'auto' }}>
            <option value="">Screen...</option>
            {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} style={{ width: 'auto' }} />
          <input type="time" className="input-field" value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} style={{ width: 'auto' }} />
          <input type="number" className="input-field" placeholder="Price" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} style={{ width: '100px' }} />
          <button onClick={addShow} className="btn-primary">Create</button>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {shows.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
            borderBottom: i < shows.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{ fontSize: '13px' }}>
              <strong>{s.movie_title}</strong> — {s.theatre_name} / {s.screen_name} — {s.date} {s.start_time} — ₹{s.price}
            </div>
            <button onClick={() => deleteShow(s.id)} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'var(--red)', color: 'var(--red)' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminShows;