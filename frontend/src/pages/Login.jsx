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
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-md)',
      background: 'radial-gradient(circle at center, var(--bg-surface) 0%, var(--bg-base) 100%)'
    }}>
      <div className="card" style={{
        padding: 'var(--space-2xl) var(--space-xl)', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <Link to="/" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
            Cine<span style={{ color: 'var(--accent-red)' }}>Max</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: 'var(--space-sm)' }}>
            Welcome back to the movies
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>
              Username
            </label>
            <input
              className="input-field"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>
              Password
            </label>
            <input
              className="input-field"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: 'var(--space-md)', background: 'rgba(224,38,63,0.1)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-red)', fontWeight: 600 }} className="hover-text-red">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;