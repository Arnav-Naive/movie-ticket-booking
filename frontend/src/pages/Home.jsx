import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WebSmashIntro from '../components/WebSmashIntro';
import { useLocationCtx } from '../context/LocationContext';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

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
    <img src={`${POSTER_BASE}${path}`} alt={title} onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  );
}

function isUpcoming(movie) {
  return movie.release_date && new Date(movie.release_date) > new Date();
}

function Home() {
  const { selectedCity } = useLocationCtx();
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showsToday, setShowsToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [slide, setSlide] = useState(0);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      api.get('/movies/'),
      api.get('/theatres/'),
      api.get(`/shows/?date=${today}`)
    ])
      .then(([moviesRes, theatresRes, showsRes]) => {
        setMovies(moviesRes.data);
        setTheatres(theatresRes.data);
        setShowsToday(showsRes.data);
      })
      .catch(() => setError('Unable to load movies.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loginFlag = sessionStorage.getItem('cinemax_login_intro');
    const seenFlag = sessionStorage.getItem('cinemax_intro_seen');
    if (loginFlag) {
      sessionStorage.removeItem('cinemax_login_intro');
      setShowIntro(true);
    } else if (!seenFlag) {
      setShowIntro(true);
    }
    sessionStorage.setItem('cinemax_intro_seen', 'true');
  }, []);

  const featured = (movies.filter(m => !isUpcoming(m)).length > 0
    ? movies.filter(m => !isUpcoming(m))
    : movies
  ).slice(0, 10);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide(s => (s + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const allGenres = [...new Set(movies.flatMap(m => (m.genre || '').split(',').map(g => g.trim()).filter(Boolean)))];
  const allLanguages = [...new Set(movies.map(m => m.language).filter(Boolean))];

  const filtered = movies.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'now' && isUpcoming(m)) return false;
    if (statusFilter === 'upcoming' && !isUpcoming(m)) return false;
    if (languageFilter !== 'all' && m.language !== languageFilter) return false;
    if (genreFilter !== 'all') {
      const genres = (m.genre || '').split(',').map(g => g.trim());
      if (!genres.includes(genreFilter)) return false;
    }
    return true;
  });

  const cityTheatres = selectedCity ? theatres.filter(t => t.city === selectedCity.id) : theatres;

  const showsCountByTheatre = (theatreName) =>
    showsToday.filter(s => s.theatre_name === theatreName).length;

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading movies...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  const pill = (active) => ({
    padding: '7px 16px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
    background: active ? 'var(--red)' : 'var(--card)',
    color: active ? 'white' : 'var(--text-dim)',
    whiteSpace: 'nowrap', flexShrink: 0
  });

  const content = (
    <div>
      {/* HERO CAROUSEL */}
      {featured.length > 0 && (
        <div style={{ position: 'relative', height: '380px', overflow: 'hidden', background: 'var(--bg-alt)' }}>
          {featured.map((m, i) => (
            <div key={m.id} style={{
              position: 'absolute', inset: 0, opacity: i === slide ? 1 : 0,
              transition: 'opacity 0.6s ease',
              backgroundImage: `linear-gradient(90deg, rgba(11,15,25,0.95) 20%, rgba(11,15,25,0.3) 70%), url(${m.backdrop_path ? BACKDROP_BASE + m.backdrop_path : (m.poster_path ? POSTER_BASE + m.poster_path : '')})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center'
            }}>
              <div className="container">
                <div style={{ maxWidth: '480px' }}>
                  <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', marginBottom: '8px' }}>
                    {isUpcoming(m) ? 'COMING SOON' : 'FEATURED'}
                  </div>
                  <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>{m.title}</h1>
                  <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>
                    ★ {m.rating} · {m.genre}
                  </div>
                  <Link to={`/movies/${m.id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {featured.length > 1 && (
            <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {featured.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{
                  width: '8px', height: '8px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === slide ? 'var(--red)' : 'rgba(255,255,255,0.3)'
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="container" style={{ padding: '32px 24px 40px' }}>
        {/* FILTER BAR */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {[['all', 'All'], ['now', 'Now Showing'], ['upcoming', 'Upcoming']].map(([v, label]) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={pill(statusFilter === v)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          <button onClick={() => setLanguageFilter('all')} style={pill(languageFilter === 'all')}>All Languages</button>
          {allLanguages.map(l => (
            <button key={l} onClick={() => setLanguageFilter(l)} style={pill(languageFilter === l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '28px', paddingBottom: '4px' }}>
          <button onClick={() => setGenreFilter('all')} style={pill(genreFilter === 'all')}>All Genres</button>
          {allGenres.map(g => (
            <button key={g} onClick={() => setGenreFilter(g)} style={pill(genreFilter === g)}>{g}</button>
          ))}
        </div>

        {/* SEARCH + HEADING */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', flexWrap: 'wrap', gap: '16px'
        }}>
          <h2 style={{ fontSize: '22px' }}>{filtered.length} movie{filtered.length !== 1 ? 's' : ''}</h2>
          <input
            type="text" className="input-field" placeholder="Search movies..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '220px', maxWidth: '280px' }}
          />
        </div>

        {/* MOVIE GRID */}
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No movies match your filters.</p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '22px', marginBottom: '48px'
          }}>
            {filtered.map(movie => (
              <div key={movie.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.15s, border-color 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#3a4258'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <Link to={`/movies/${movie.id}`} style={{ display: 'block', position: 'relative' }}>
                  <div style={{ aspectRatio: '2/3' }}>
                    <MoviePoster path={movie.poster_path} title={movie.title} />
                  </div>
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(11,15,25,0.85)', border: '1px solid var(--border)',
                    padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600
                  }}>
                    ★ {movie.rating}
                  </div>
                </Link>
                <div style={{ padding: '14px' }}>
                  <Link to={`/movies/${movie.id}`}>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{movie.title}</div>
                  </Link>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                    {movie.genre} · {movie.language?.toUpperCase()}
                  </div>
                  <Link to={`/movies/${movie.id}`} className="btn-primary" style={{
                    textDecoration: 'none', display: 'block', textAlign: 'center', padding: '8px', fontSize: '13px'
                  }}>
                    Book Tickets
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CINEMA STRIP */}
        {cityTheatres.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
              Cinemas near {selectedCity?.name || 'you'}
            </h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {cityTheatres.map(t => (
                <div key={t.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
                  padding: '18px', minWidth: '220px', flexShrink: 0
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.name}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '10px' }}>{t.address}</div>
                  <div style={{ fontSize: '12px', color: showsCountByTheatre(t.name) > 0 ? '#2ecc71' : 'var(--text-dim)' }}>
                    {showsCountByTheatre(t.name)} show(s) today
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return showIntro ? <WebSmashIntro>{content}</WebSmashIntro> : content;
}

export default Home;