import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', { username, password });
      const meRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${res.data.access}` }
      });
      login(meRes.data, res.data.access, res.data.refresh);
      showToast(`Welcome back, ${meRes.data.username}!`, 'success');
      sessionStorage.setItem('cinemax_login_intro', 'true');
      navigate('/');
    } catch (err) {
      setError('Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px'
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '36px', maxWidth: '380px', width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ fontSize: '24px', fontWeight: 700 }}>
            Cine<span style={{ color: 'var(--red)' }}>Max</span>
          </Link>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '8px' }}>
            Welcome back — log in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
            Username
          </label>
          <input
            className="input-field"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
            Password
          </label>
          <input
            className="input-field"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '20px' }}
          />

          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;