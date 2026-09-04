import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationCtx } from '../context/LocationContext';
import api from '../services/api';

function Navbar() {
  const { user, logout } = useAuth();
  const { cities, selectedCity, setSelectedCity } = useLocationCtx();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/wallet/').then(res => setBalance(res.data.balance)).catch(() => {});
    } else {
      setBalance(null);
    }
  }, [user]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navStyles = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-md) var(--space-lg)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    },
    logo: {
      fontSize: '22px',
      fontWeight: 700,
      letterSpacing: '-0.5px',
      display: 'flex',
      alignItems: 'center'
    },
    link: {
      color: 'var(--text-main)',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'color var(--transition-fast)'
    },
    menu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-md) var(--space-lg)',
      gap: 'var(--space-md)',
      boxShadow: 'var(--shadow-card)'
    }
  };

  return (
    <nav style={navStyles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Link to="/" style={navStyles.logo} onClick={() => setMenuOpen(false)}>
          Cine<span style={{ color: 'var(--accent-red)' }}>Max</span>
        </Link>
        {cities.length > 0 && (
          <select
            value={selectedCity?.id || ''}
            onChange={(e) => setSelectedCity(cities.find(c => c.id === Number(e.target.value)))}
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', minWidth: '120px' }}
          >
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="nav-links-desktop" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
        <Link to="/" style={navStyles.link} className="hover-text-red">Movies</Link>
        {user && <Link to="/my-bookings" style={navStyles.link} className="hover-text-red">My Bookings</Link>}
        {user && <Link to="/profile" style={navStyles.link} className="hover-text-red">Profile</Link>}
        {user?.is_staff && <Link to="/admin-panel" style={{ ...navStyles.link, color: 'var(--accent-red)' }}>Admin</Link>}
        {(user?.is_staff || user?.is_verifier) && <Link to="/scan" style={navStyles.link} className="hover-text-red">Scan Tickets</Link>}
        
        {user && balance !== null && (
          <span style={{
            background: 'var(--bg-card)', 
            border: '1px solid var(--accent-red)', 
            color: 'var(--accent-red)',
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '13px', 
            fontWeight: 600,
            boxShadow: 'var(--shadow-glow)'
          }}>
            ₹{balance} CineRP
          </span>
        )}
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Hi, {user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 16px' }}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Sign Up</Link>
          </div>
        )}
      </div>

      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '24px', cursor: 'pointer', padding: '4px' }}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div style={navStyles.menu}>
          <Link to="/">Movies</Link>
          {user && <Link to="/my-bookings">My Bookings</Link>}
          {user && <Link to="/profile">Profile</Link>}
          {user?.is_staff && <Link to="/admin-panel" style={{ color: 'var(--accent-red)' }}>Admin</Link>}
          {(user?.is_staff || user?.is_verifier) && <Link to="/scan">Scan Tickets</Link>}
          {user && balance !== null && (
            <span style={{ color: 'var(--accent-red)', fontSize: '14px', fontWeight: 600 }}>₹{balance} CineRP Balance</span>
          )}
          {user ? (
            <button onClick={handleLogout} className="btn btn-ghost" style={{ marginTop: 'var(--space-sm)' }}>Logout</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;