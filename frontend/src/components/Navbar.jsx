import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationCtx } from '../context/LocationContext';
import api from '../services/api';

function Navbar() {
  const { user, logout } = useAuth();
  const { cities, selectedCity, setSelectedCity } = useLocationCtx();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/wallet/').then(res => setBalance(res.data.balance)).catch(() => {});
    } else {
      setBalance(null);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50, gap: '16px', flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <Link to="/" style={{ fontSize: '22px', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>
          Cine<span style={{ color: 'var(--red)' }}>Max</span>
        </Link>
        {cities.length > 0 && (
          <select
            value={selectedCity?.id || ''}
            onChange={(e) => setSelectedCity(cities.find(c => c.id === Number(e.target.value)))}
            className="input-field"
            style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
          >
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="nav-links-desktop" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/">Movies</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user && <Link to="/profile">Profile</Link>}
        {user && balance !== null && (
          <span style={{
            background: 'var(--card)', border: '1px solid var(--red)', color: 'var(--red)',
            padding: '5px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600
          }}>
            ₹{balance} CineRP
          </span>
        )}
        {user ? (
          <>
            <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Hi, {user.username}</span>
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Sign Up</Link>
          </>
        )}
      </div>

      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '24px', cursor: 'pointer' }}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: '14px'
        }}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Movies</Link>
          {user && <Link to="/my-bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link>}
          {user && <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>}
          {user && balance !== null && (
            <span style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 600 }}>₹{balance} CineRP</span>
          )}
          {user ? (
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;