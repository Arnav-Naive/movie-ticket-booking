import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

function MoviePoster({ path, title }) {
  const [errored, setErrored] = useState(false);
  if (!path || errored) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1e2436', color: 'var(--text-dim)', fontSize: '12px', textAlign: 'center', padding: '8px'
      }}>
        {title}
      </div>
    );
  }
  return (
    <img
      src={`${TMDB_IMAGE_BASE}${path}`}
      alt={title}
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/movies/')
      .then(res => setMovies(res.data))
      .catch(() => setError('Unable to load movies.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredMovies = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading movies...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <h1 style={{ fontSize: '28px' }}>Now Showing</h1>
        <input
          type="text"
          className="input-field"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '220px', maxWidth: '280px' }}
        />
      </div>

      {filteredMovies.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>
          {search ? `No movies found matching "${search}".` : 'No movies found.'}
        </p>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px'
        }}>
          {filteredMovies.map(movie => (
            <Link to={`/movies/${movie.id}`} key={movie.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden', display: 'block',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3a4258'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ aspectRatio: '2/3' }}>
                <MoviePoster path={movie.poster_path} title={movie.title} />
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{movie.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{movie.genre}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;