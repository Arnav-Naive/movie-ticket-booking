import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      showToast('Account created! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Registration failed.');
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
            Create an account to start booking
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>Username</label>
            <input className="input-field" name="username" placeholder="Choose a username" onChange={handleChange} required />
          </div>

          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>Email</label>
            <input className="input-field" name="email" type="email" placeholder="you@example.com" onChange={handleChange} required />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>Password</label>
            <input className="input-field" name="password" type="password" placeholder="At least 8 characters" onChange={handleChange} required minLength={8} />
          </div>

          {error && (
            <div style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: 'var(--space-md)', background: 'rgba(224,38,63,0.1)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-red)', fontWeight: 600 }} className="hover-text-red">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;