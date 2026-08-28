import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();

  if (!user) return <div className="container" style={{ padding: '60px 0' }}>Please log in to view your profile.</div>;

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '420px' }}>
      <h1 style={{ marginBottom: '24px' }}>My Profile</h1>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>Username</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.username}</div>
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.email || '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default Profile;