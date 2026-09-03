import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function AdminMovies() {
  const { showToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/movies/').then(res => setMovies(res.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const search = () => {
    if (query.trim().length < 2) return;
    api.get(`/movies/live-search/?query=${encodeURIComponent(query)}`).then(res => setResults(res.data));
  };

  const importMovie = async (tmdbId) => {
    setBusyId(tmdbId);
    try {
      await api.post('/movies/auto-import/', { tmdb_id: tmdbId });
      showToast('Movie added', 'success');
      setResults(null);
      setQuery('');
      load();
    } catch {
      showToast('Import failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteMovie = async (id) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return;
    try {
      await api.delete(`/movies/${id}/`);
      showToast('Movie deleted', 'success');
      load();
    } catch {
      showToast('Delete failed (movie may have active shows)', 'error');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Movies</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <input
          className="input-field" placeholder="Search TMDB to add a movie..."
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button onClick={search} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Search</button>
      </div>

      {results && (
        <div style={{ marginBottom: '28px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
          {results.remote.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No new results (already in catalog or none found).</p>
          ) : results.remote.map(m => (
            <div key={m.tmdb_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span>{m.title} {m.release_date && `(${m.release_date.slice(0,4)})`}</span>
              <button onClick={() => importMovie(m.tmdb_id)} disabled={busyId === m.tmdb_id} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px' }}>
                {busyId === m.tmdb_id ? 'Adding...' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {movies.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
            borderBottom: i < movies.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{m.genre} · ★ {m.rating}</div>
            </div>
            <button onClick={() => deleteMovie(m.id)} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'var(--red)', color: 'var(--red)' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminMovies;