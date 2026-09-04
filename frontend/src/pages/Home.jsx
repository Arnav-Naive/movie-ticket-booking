import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import WebSmashIntro from '../components/WebSmashIntro';
import { useLocationCtx } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

function MoviePoster({ path, title }) {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!path || errored) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: 'var(--space-sm)'
      }}>
        {title}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && <div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div>}
      <img 
        src={`${POSTER_BASE}${path}`} 
        alt={title} 
        onLoad={() => setLoading(false)}
        onError={() => setErrored(true)}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          opacity: loading ? 0 : 1,
          transition: 'opacity var(--transition-base)'
        }} 
      />
    </div>
  );
}

function isUpcoming(movie) {
  return movie.release_date && new Date(movie.release_date) > new Date();
}

function Home() {
  const { selectedCity } = useLocationCtx();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showsToday, setShowsToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [liveResults, setLiveResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState(null);
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

  // Debounced live search
  useEffect(() => {
    if (search.trim().length < 2) {
      setLiveResults(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api.get(`/movies/live-search/?query=${encodeURIComponent(search)}`)
        .then(res => setLiveResults(res.data))
        .catch(() => setLiveResults({ local: [], remote: [] }))
        .finally(() => setSearching(false));
    }, 450);
    return () => clearTimeout(t);
  }, [search]);

  const handleAutoImport = async (tmdbId) => {
    if (!user?.is_staff) return;
    setImportingId(tmdbId);
    try {
      const res = await api.post('/movies/auto-import/', { tmdb_id: tmdbId });
      navigate(`/movies/${res.data.id}`);
    } catch (err) {
      showToast('Unable to add this movie right now.', 'error');
    } finally {
      setImportingId(null);
    }
  };

  const featured = (movies.filter(m => !isUpcoming(m)).length > 0
    ? movies.filter(m => !isUpcoming(m))
    : movies
  ).slice(0, 5);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide(s => (s + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const allGenres = [...new Set(movies.flatMap(m => (m.genre || '').split(',').map(g => g.trim()).filter(Boolean)))];
  const allLanguages = [...new Set(movies.map(m => m.language).filter(Boolean))];

  const filtered = movies.filter(m => {
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
  const showsCountByTheatre = (theatreName) => showsToday.filter(s => s.theatre_name === theatreName).length;

  if (loading) return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div className="skeleton" style={{ height: '380px', width: '100%', borderRadius: 'var(--radius-lg)' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-lg)' }}></div>)}
      </div>
    </div>
  );
  if (error) return <div className="container" style={{ padding: 'var(--space-2xl) 0', color: 'var(--accent-red)', textAlign: 'center' }}>{error}</div>;

  const pillStyle = (active) => ({
    padding: '8px var(--space-md)', 
    borderRadius: 'var(--radius-full)', 
    fontSize: '13px', 
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
    background: active ? 'var(--accent-red)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-muted)',
    whiteSpace: 'nowrap', 
    flexShrink: 0,
    transition: 'all var(--transition-fast)'
  });

  const isSearchMode = liveResults !== null;

  const content = (
    <div>
      {!isSearchMode && featured.length > 0 && (
        <div style={{ position: 'relative', height: '440px', overflow: 'hidden', background: 'var(--bg-surface)' }}>
          {featured.map((m, i) => (
            <div key={m.id} style={{
              position: 'absolute', inset: 0, opacity: i === slide ? 1 : 0,
              transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundImage: `linear-gradient(90deg, rgba(11,15,25,1) 10%, rgba(11,15,25,0.6) 50%, rgba(11,15,25,0) 100%), linear-gradient(0deg, rgba(11,15,25,1) 0%, rgba(11,15,25,0) 30%), url(${m.backdrop_path ? BACKDROP_BASE + m.backdrop_path : (m.poster_path ? POSTER_BASE + m.poster_path : '')})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center'
            }}>
              <div className="container">
                <div style={{ maxWidth: '520px', padding: 'var(--space-lg) 0' }}>
                  <div style={{ 
                    color: 'var(--accent-red)', fontWeight: 700, fontSize: '13px', 
                    letterSpacing: '1.5px', marginBottom: 'var(--space-sm)', textTransform: 'uppercase'
                  }}>
                    {isUpcoming(m) ? 'Coming Soon' : 'Featured Premiere'}
                  </div>
                  <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: 'var(--space-sm)', lineHeight: 1.1 }}>
                    {m.title}
                  </h1>
                  <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', color: '#f39c12', fontWeight: 600 }}>
                      ★ {m.rating}
                    </span> 
                    <span>&bull;</span>
                    <span>{m.genre}</span>
                  </div>
                  <Link to={`/movies/${m.id}`} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
                    Book Tickets
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {featured.length > 1 && (
            <div style={{ position: 'absolute', bottom: 'var(--space-lg)', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)' }}>
              {featured.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Go to slide ${i+1}`} style={{
                  width: i === slide ? '24px' : '8px', 
                  height: '8px', 
                  borderRadius: 'var(--radius-full)', 
                  border: 'none', 
                  cursor: 'pointer',
                  background: i === slide ? 'var(--accent-red)' : 'rgba(255,255,255,0.3)',
                  transition: 'all var(--transition-base)'
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="container" style={{ padding: 'var(--space-xl) var(--space-lg) var(--space-2xl)' }}>
        {!isSearchMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {[['all', 'All Movies'], ['now', 'Now Showing'], ['upcoming', 'Coming Soon']].map(([v, label]) => (
                <button key={v} onClick={() => setStatusFilter(v)} style={pillStyle(statusFilter === v)}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              <button onClick={() => setLanguageFilter('all')} style={pillStyle(languageFilter === 'all')}>All Languages</button>
              {allLanguages.map(l => (
                <button key={l} onClick={() => setLanguageFilter(l)} style={pillStyle(languageFilter === l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              <button onClick={() => setGenreFilter('all')} style={pillStyle(genreFilter === 'all')}>All Genres</button>
              {allGenres.map(g => (
                <button key={g} onClick={() => setGenreFilter(g)} style={pillStyle(genreFilter === g)}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH + HEADING */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
            {isSearchMode ? `Search results for "${search}"` : `${filtered.length} movie${filtered.length !== 1 ? 's' : ''}`}
          </h2>
          <input
            type="text" 
            className="input-field" 
            placeholder="Search movies..."
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '220px', maxWidth: '300px' }}
          />
        </div>

        {isSearchMode ? (
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            {searching && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-lg)' }}></div>)}
              </div>
            )}

            {!searching && liveResults.local.length === 0 && liveResults.remote.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🔍</div>
                <p>No movies found for "{search}"</p>
              </div>
            )}

            {liveResults.local.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'
              }}>
                {liveResults.local.map(movie => (
                  <Link to={`/movies/${movie.id}`} key={movie.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '2/3', overflow: 'hidden' }}>
                      <MoviePoster path={movie.poster_path} title={movie.title} />
                    </div>
                    <div style={{ padding: 'var(--space-md)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-main)' }}>{movie.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 'auto' }}>{movie.genre}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {liveResults.remote.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></span>
                  MORE FROM TMDB (Not yet in CineMax)
                  <span style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
                  {liveResults.remote.map(movie => (
                    <div key={movie.tmdb_id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ aspectRatio: '2/3', overflow: 'hidden' }}>
                        <MoviePoster path={movie.poster_path} title={movie.title} />
                      </div>
                      <div style={{ padding: 'var(--space-md)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>{movie.title}</div>
                        {user?.is_staff ? (
                          <button
                            onClick={() => handleAutoImport(movie.tmdb_id)}
                            disabled={importingId === movie.tmdb_id}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'auto' }}
                          >
                            {importingId === movie.tmdb_id ? 'Adding...' : 'Add to CineMax'}
                          </button>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginTop: 'auto' }}>
                            Not available
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--text-muted)' }}>
                <p>No movies match your selected filters.</p>
                <button onClick={() => { setStatusFilter('all'); setGenreFilter('all'); setLanguageFilter('all'); }} className="btn btn-ghost" style={{ marginTop: 'var(--space-md)' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)'
              }}>
                {filtered.map(movie => (
                  <div key={movie.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Link to={`/movies/${movie.id}`} style={{ display: 'block', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ aspectRatio: '2/3', transition: 'transform var(--transition-base)' }} className="poster-wrapper">
                        <MoviePoster path={movie.poster_path} title={movie.title} />
                      </div>
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(4px)',
                        border: '1px solid var(--border-subtle)',
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 700,
                        color: '#f39c12', display: 'flex', alignItems: 'center', gap: '4px',
                        boxShadow: 'var(--shadow-card)'
                      }}>
                        ★ {movie.rating}
                      </div>
                    </Link>
                    <div style={{ padding: 'var(--space-md)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-main)', lineHeight: 1.3 }}>{movie.title}</div>
                      </Link>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        {movie.genre} &bull; {movie.language?.toUpperCase()}
                      </div>
                      <Link to={`/movies/${movie.id}`} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                        Book Tickets
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cityTheatres.length > 0 && (
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Cinemas near {selectedCity?.name || 'you'}</h2>
                <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)', scrollbarWidth: 'none' }}>
                  {cityTheatres.map(t => (
                    <div key={t.id} className="card" style={{ padding: 'var(--space-md)', minWidth: '260px', flexShrink: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 'var(--space-xs)' }}>{t.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--space-md)', lineHeight: 1.4 }}>{t.address}</div>
                      <div style={{ 
                        fontSize: '13px', fontWeight: 500,
                        color: showsCountByTheatre(t.name) > 0 ? 'var(--success)' : 'var(--text-muted)',
                        background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'inline-block'
                      }}>
                        {showsCountByTheatre(t.name)} show{showsCountByTheatre(t.name) !== 1 ? 's' : ''} today
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return showIntro ? <WebSmashIntro>{content}</WebSmashIntro> : content;
}

export default Home;