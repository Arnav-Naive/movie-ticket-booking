import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50
    }}>
      <Link to="/" style={{ fontSize: '22px', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>
        Cine<span style={{ color: 'var(--red)' }}>Max</span>
      </Link>

      <div className="nav-links-desktop" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/">Movies</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user && <Link to="/profile">Profile</Link>}
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
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text)', fontSize: '24px', cursor: 'pointer'
        }}
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