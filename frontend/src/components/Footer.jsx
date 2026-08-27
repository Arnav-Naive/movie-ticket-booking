import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)', padding: '24px', marginTop: '60px',
      textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px'
    }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '10px' }}>
        <Link to="/about" style={{ color: 'var(--text-dim)' }}>About</Link>
        <Link to="/contact" style={{ color: 'var(--text-dim)' }}>Contact</Link>
        <Link to="/terms" style={{ color: 'var(--text-dim)' }}>Terms & Privacy</Link>
      </div>
      <div>© 2026 CineMax — a college project, not affiliated with any real cinema chain.</div>
      <div style={{ marginTop: '4px' }}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </div>
    </footer>
  );
}

export default Footer;