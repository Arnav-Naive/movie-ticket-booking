import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

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
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '10px 16px', borderRadius: '8px',
            fontSize: '14px', minWidth: '220px'
          }}
        />
      </div>

      {filteredMovies.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>
          {search ? `No movies found matching "${search}".` : 'No movies found.'}
        </p>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px'
        }}>
          {filteredMovies.map(movie => (
            <Link to={`/movies/${movie.id}`} key={movie.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '10px', overflow: 'hidden', display: 'block'
            }}>
              <div style={{ aspectRatio: '2/3', background: '#1e2436' }}>
                {movie.poster_path && (
                  <img
                    src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
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