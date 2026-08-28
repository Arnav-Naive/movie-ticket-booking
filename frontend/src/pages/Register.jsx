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
            Create an account to start booking
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>Username</label>
          <input className="input-field" name="username" placeholder="Choose a username" onChange={handleChange} required style={{ marginBottom: '16px' }} />

          <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>Email</label>
          <input className="input-field" name="email" type="email" placeholder="you@example.com" onChange={handleChange} required style={{ marginBottom: '16px' }} />

          <label style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>Password</label>
          <input className="input-field" name="password" type="password" placeholder="At least 8 characters" onChange={handleChange} required minLength={8} style={{ marginBottom: '20px' }} />

          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;