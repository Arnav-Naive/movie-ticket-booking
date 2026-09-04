import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

const links = [
  { to: '/admin-panel', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/admin-panel/movies', label: 'Movies', icon: '🎬' },
  { to: '/admin-panel/theatres', label: 'Theatres & Screens', icon: '🍿' },
  { to: '/admin-panel/shows', label: 'Shows', icon: '🗓️' },
  { to: '/admin-panel/snacks', label: 'Snacks & Combos', icon: '🥤' },
  { to: '/admin-panel/bookings', label: 'Bookings', icon: '🎟️' },
  { to: '/admin-panel/verify', label: 'Verify Ticket', icon: '✅' },
  { to: '/admin-panel/users', label: 'Users', icon: '👥' },
];

function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="container" style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
      {/* Mobile Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-subtle)', '@media (minWidth: 769px)': { display: 'none' } }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-red)' }}>Admin Panel</div>
        <button 
          className="btn btn-ghost" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ padding: '8px 12px', display: 'flex' }}
        >
          {mobileMenuOpen ? '✕ Close Menu' : '☰ Admin Menu'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          width: '240px', flexShrink: 0, display: mobileMenuOpen ? 'flex' : 'none', flexDirection: 'column', gap: '8px',
          position: 'sticky', top: '100px',
          background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)'
        }} className="admin-sidebar">
          
          {links.map(l => (
            <NavLink
              key={l.to} to={l.to} end={l.end}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: isActive ? 600 : 500,
                background: isActive ? 'rgba(224,38,63,0.1)' : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'all var(--transition-fast)'
              })}
            >
              <span style={{ fontSize: '16px' }}>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 'min(100%, 600px)', paddingBottom: 'var(--space-2xl)' }}>
          <Outlet />
        </div>
      </div>
      
      {/* Dirty hack for inline media queries not supported in React style obj without a library. We'll add a class to index.css if needed, or rely on flex-wrap above */}
      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar { display: flex !important; }
          .btn-ghost:contains('Admin Menu') { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminLayout;