import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function AdminTheatres() {
  const { showToast } = useToast();
  const [cities, setCities] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);

  const [newCity, setNewCity] = useState('');
  const [theatreForm, setTheatreForm] = useState({ name: '', address: '', city: '' });
  const [screenForm, setScreenForm] = useState({ theatre: '', name: '' });
  const [layoutForm, setLayoutForm] = useState({ screen: '', rows: '' });

  const loadAll = () => {
    api.get('/cities/').then(res => setCities(res.data));
    api.get('/theatres/').then(res => setTheatres(res.data));
    api.get('/screens/').then(res => setScreens(res.data));
  };
  useEffect(() => { loadAll(); }, []);

  const addCity = async () => {
    if (!newCity.trim()) return;
    await api.post('/cities/', { name: newCity });
    setNewCity('');
    showToast('City added', 'success');
    loadAll();
  };

  const addTheatre = async () => {
    if (!theatreForm.name || !theatreForm.city) return;
    await api.post('/theatres/', theatreForm);
    setTheatreForm({ name: '', address: '', city: '' });
    showToast('Theatre added', 'success');
    loadAll();
  };

  const addScreen = async () => {
    if (!screenForm.theatre || !screenForm.name) return;
    await api.post('/screens/', screenForm);
    setScreenForm({ theatre: '', name: '' });
    showToast('Screen added', 'success');
    loadAll();
  };

  const buildLayout = async () => {
    if (!layoutForm.screen || !layoutForm.rows) return;
    // rows format: "A:8:REGULAR, B:8:REGULAR, C:6:PREMIUM"
    const layout = layoutForm.rows.split(',').map(part => {
      const [row, count, seat_type] = part.trim().split(':');
      return { row: row?.trim(), count: Number(count), seat_type: (seat_type || 'REGULAR').trim().toUpperCase() };
    }).filter(r => r.row && r.count);

    try {
      const res = await api.post(`/screens/${layoutForm.screen}/build-layout/`, { layout });
      showToast(res.data.message, 'success');
      setLayoutForm({ screen: '', rows: '' });
    } catch {
      showToast('Failed to build layout', 'error');
    }
  };

  const box = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '20px' };
  const row = { display: 'flex', gap: '10px', flexWrap: 'wrap' };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Theatres & Screens</h1>

      <div style={box}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Add City</h3>
        <div style={row}>
          <input className="input-field" placeholder="City name" value={newCity} onChange={(e) => setNewCity(e.target.value)} style={{ flex: 1, minWidth: '160px' }} />
          <button onClick={addCity} className="btn-primary">Add</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Add Theatre</h3>
        <div style={row}>
          <input className="input-field" placeholder="Name" value={theatreForm.name} onChange={(e) => setTheatreForm({...theatreForm, name: e.target.value})} style={{ flex: 1, minWidth: '140px' }} />
          <input className="input-field" placeholder="Address" value={theatreForm.address} onChange={(e) => setTheatreForm({...theatreForm, address: e.target.value})} style={{ flex: 1, minWidth: '140px' }} />
          <select className="input-field" value={theatreForm.city} onChange={(e) => setTheatreForm({...theatreForm, city: e.target.value})} style={{ width: 'auto' }}>
            <option value="">City...</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={addTheatre} className="btn-primary">Add</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Add Screen</h3>
        <div style={row}>
          <select className="input-field" value={screenForm.theatre} onChange={(e) => setScreenForm({...screenForm, theatre: e.target.value})} style={{ width: 'auto' }}>
            <option value="">Theatre...</option>
            {theatres.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="input-field" placeholder="Screen name (e.g. Screen 2)" value={screenForm.name} onChange={(e) => setScreenForm({...screenForm, name: e.target.value})} style={{ flex: 1, minWidth: '160px' }} />
          <button onClick={addScreen} className="btn-primary">Add</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginBottom: '4px', fontSize: '15px' }}>Bulk Seat Layout Builder</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
          Format: <code>Row:Count:Type</code> comma-separated. Example: <code>A:8:REGULAR, B:8:REGULAR, C:6:PREMIUM</code>
        </p>
        <div style={row}>
          <select className="input-field" value={layoutForm.screen} onChange={(e) => setLayoutForm({...layoutForm, screen: e.target.value})} style={{ width: 'auto' }}>
            <option value="">Screen...</option>
            {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input-field" placeholder="A:8:REGULAR, B:8:PREMIUM" value={layoutForm.rows} onChange={(e) => setLayoutForm({...layoutForm, rows: e.target.value})} style={{ flex: 1, minWidth: '220px' }} />
          <button onClick={buildLayout} className="btn-primary">Build</button>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Existing Theatres</h3>
        {theatres.map(t => (
          <div key={t.id} style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '4px 0' }}>
            {t.name} — {t.address}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminTheatres;