function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)', padding: '24px', marginTop: '60px',
      textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px'
    }}>
      <div>© 2026 CineMax — a college project, not affiliated with any real cinema chain.</div>
      <div style={{ marginTop: '4px' }}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </div>
    </footer>
  );
}

export default Footer;