import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgErrored, setImgErrored] = useState(false);

  useEffect(() => {
    api.get(`/movies/${id}/`)
      .then(res => setMovie(res.data))
      .catch(() => setError('Movie not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  const castList = movie.cast ? movie.cast.split(',').map(c => c.trim()).filter(Boolean) : [];

  return (
    <div>
      <div className="container movie-details-layout" style={{ padding: '40px 0', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ aspectRatio: '2/3', borderRadius: '10px', overflow: 'hidden', background: '#1e2436' }}>
            {movie.poster_path && !imgErrored ? (
              <img
                src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                alt={movie.title}
                onError={() => setImgErrored(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-dim)', fontSize: '14px', padding: '12px', textAlign: 'center'
              }}>
                {movie.title}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: '1', minWidth: '260px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{movie.title}</h1>
          <div style={{ display: 'flex', gap: '14px', color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span>★ {movie.rating}</span>
            <span>{movie.runtime} min</span>
            <span>{movie.genre}</span>
            <span>{movie.language}</span>
          </div>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '600px' }}>
            {movie.overview}
          </p>

          {castList.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>CAST</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {castList.map((name, i) => (
                  <span key={i} style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    padding: '6px 12px', borderRadius: '999px', fontSize: '13px'
                  }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link to={`/book/${movie.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Book Tickets
          </Link>
        </div>
      </div>

      {movie.trailer_key && (
        <div className="container" style={{ paddingBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '12px' }}>TRAILER</div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, maxWidth: '700px', borderRadius: '10px', overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer_key}`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;