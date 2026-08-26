import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function BookShow() {
  const { movieId } = useParams();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/shows/?movie=${movieId}`)
      .then(res => setShows(res.data))
      .catch(() => setError('Unable to load shows.'))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) return <div className="container" style={{ padding: '60px 0' }}>Loading shows...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0' }}>{error}</div>;

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ marginBottom: '24px' }}>Select a Show</h1>
      {shows.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>No shows available for this movie.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {shows.map(show => (
            <div key={show.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{show.theatre_name}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                  {show.screen_name} · {show.date} · {show.start_time} · ₹{show.price}
                </div>
              </div>
              <Link to={`/seats/${show.id}`} style={{
                background: 'var(--red)', color: 'white', padding: '10px 20px',
                borderRadius: '8px', fontWeight: 600
              }}>
                Select Seats
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookShow;