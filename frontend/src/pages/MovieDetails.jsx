import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgErrored, setImgErrored] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    api.get(`/movies/${id}/`)
      .then(res => setMovie(res.data))
      .catch(() => setError('Movie not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', display: 'flex', gap: 'var(--space-xl)' }}>
      <div className="skeleton" style={{ width: '280px', height: '420px', borderRadius: 'var(--radius-lg)' }}></div>
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: '40px', marginBottom: 'var(--space-md)' }}></div>
        <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: 'var(--space-lg)' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '100px', marginBottom: 'var(--space-xl)' }}></div>
        <div className="skeleton" style={{ width: '150px', height: '48px', borderRadius: 'var(--radius-md)' }}></div>
      </div>
    </div>
  );
  
  if (error) return <div className="container" style={{ padding: 'var(--space-2xl) 0', color: 'var(--accent-red)' }}>{error}</div>;

  const castList = movie.cast ? movie.cast.split(',').map(c => c.trim()).filter(Boolean) : [];

  return (
    <div>
      {/* Blurred Backdrop */}
      {movie.backdrop_path && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '70vh',
          backgroundImage: `linear-gradient(to bottom, rgba(11,15,25,0.4) 0%, rgba(11,15,25,1) 100%), url(${BACKDROP_BASE}${movie.backdrop_path})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: -1,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}></div>
      )}

      <div className="container movie-details-layout" style={{ padding: 'var(--space-2xl) var(--space-lg)', display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div className="card" style={{ aspectRatio: '2/3', overflow: 'hidden', padding: 0, position: 'relative' }}>
            {imgLoading && <div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div>}
            {movie.poster_path && !imgErrored ? (
              <img
                src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                alt={movie.title}
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgErrored(true); setImgLoading(false); }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  opacity: imgLoading ? 0 : 1,
                  transition: 'opacity var(--transition-base)'
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '14px', padding: '12px', textAlign: 'center',
                background: 'var(--bg-surface)'
              }}>
                {movie.title}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ flex: '1', minWidth: '260px', alignSelf: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: 'var(--space-sm)', lineHeight: 1.1 }}>{movie.title}</h1>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '15px', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#f39c12', fontWeight: 600, background: 'rgba(243, 156, 18, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              ★ {movie.rating}
            </span>
            <span>&bull;</span>
            <span>{movie.runtime} min</span>
            <span>&bull;</span>
            <span>{movie.genre}</span>
            <span>&bull;</span>
            <span style={{ textTransform: 'uppercase' }}>{movie.language}</span>
          </div>
          
          <p style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 'var(--space-xl)', maxWidth: '700px', fontSize: '16px' }}>
            {movie.overview}
          </p>

          {castList.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cast</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {castList.map((name, i) => (
                  <span key={i} style={{
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 16px', 
                    borderRadius: 'var(--radius-full)', 
                    fontSize: '13px',
                    color: 'var(--text-main)'
                  }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link to={`/book/${movie.id}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '16px' }}>
            Book Tickets
          </Link>
        </div>
      </div>

      {movie.trailer_key && (
        <div className="container" style={{ paddingBottom: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Trailer</div>
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', 
            height: 0, 
            maxWidth: '800px', 
            overflow: 'hidden', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}>
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