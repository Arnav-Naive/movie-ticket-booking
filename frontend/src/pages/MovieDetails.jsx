import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/movies/${id}/`)
      .then(res => setMovie(res.data))
      .catch(() => setError('Movie not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  return (
    <div className="container" style={{ padding: '40px 0', display: 'flex', gap: '32px' }}>
      <div style={{ width: '280px', flexShrink: 0 }}>
        {movie.poster_path && (
          <img
            src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
            alt={movie.title}
            style={{ width: '100%', borderRadius: '10px' }}
          />
        )}
      </div>
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{movie.title}</h1>
        <div style={{ display: 'flex', gap: '14px', color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>
          <span>★ {movie.rating}</span>
          <span>{movie.runtime} min</span>
          <span>{movie.genre}</span>
          <span>{movie.language}</span>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '600px' }}>
          {movie.overview}
        </p>
        <Link to={`/book/${movie.id}`} style={{
          background: 'var(--red)', color: 'white', padding: '12px 28px',
          borderRadius: '8px', fontWeight: 600, display: 'inline-block'
        }}>
          Book Tickets
        </Link>
      </div>
    </div>
  );
}

export default MovieDetails;