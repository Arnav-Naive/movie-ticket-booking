import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin-panel', label: 'Dashboard', end: true },
  { to: '/admin-panel/movies', label: 'Movies' },
  { to: '/admin-panel/theatres', label: 'Theatres & Screens' },
  { to: '/admin-panel/shows', label: 'Shows' },
  { to: '/admin-panel/snacks', label: 'Snacks & Combos' },
  { to: '/admin-panel/bookings', label: 'Bookings' },
  { to: '/admin-panel/verify', label: 'Verify Ticket' },
  { to: '/admin-panel/users', label: 'Users' },
];

function AdminLayout() {
  return (
    <div className="container" style={{ padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <div style={{
        width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px',
        position: 'sticky', top: '90px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', letterSpacing: '1px' }}>ADMIN PANEL</div>
        {links.map(l => (
          <NavLink
            key={l.to} to={l.to} end={l.end}
            style={({ isActive }) => ({
              padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
              background: isActive ? 'var(--card)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
              borderLeft: isActive ? '2px solid var(--red)' : '2px solid transparent',
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;