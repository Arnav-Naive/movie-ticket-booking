function About() {
  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '700px' }}>
      <h1 style={{ marginBottom: '20px' }}>About CineMax</h1>
      <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '16px' }}>
        CineMax is a college project built to demonstrate a full-stack movie ticket booking
        platform — from real movie data and seat selection to secure payments and digital tickets.
      </p>
      <p style={{ color: 'var(--text-dim)', lineHeight: 1.7 }}>
        This product uses the TMDB API for movie data but is not endorsed or certified by TMDB.
        All payments are processed through Razorpay Test Mode — no real transactions occur.
        CineMax is not affiliated with any real cinema chain.
      </p>
    </div>
  );
}

export default About;