import { useState } from 'react';
import api from './services/api';

function App() {
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    try {
      const res = await api.post('/auth/login/', {
        username: 'testuser1',
        password: 'testpass123',
      });
      setMessage('Connected! Access token: ' + res.data.access.substring(0, 20) + '...');
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div>
      <h1>Connection Test</h1>
      <button onClick={testConnection}>Test Backend Connection</button>
      <p>{message}</p>
    </div>
  );
}

export default App;