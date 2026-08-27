import { useState } from 'react';
import api from '../services/api';
import WebSmashIntro from '../components/WebSmashIntro';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      alert('Login successful!');
    } catch (err) {
      setError('Login failed. Check credentials.');
    }
  };

  return (
    <WebSmashIntro>
      <div>
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </WebSmashIntro>
  );
}

export default Login;