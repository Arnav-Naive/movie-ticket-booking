import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10
    }}>
      <Link to="/" style={{ fontSize: '22px', fontWeight: 700 }}>
        Cine<span style={{ color: 'var(--red)' }}>Max</span>
      </Link>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/">Movies</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user ? (
          <>
            <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Hi, {user.username}</span>
            <button onClick={handleLogout} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
            }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" style={{
              background: 'var(--red)', padding: '8px 16px', borderRadius: '6px'
            }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;