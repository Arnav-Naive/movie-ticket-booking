import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--red)' }}>404</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>This page doesn't exist.</p>
      <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;