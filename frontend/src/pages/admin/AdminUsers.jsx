import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);

  const load = () => api.get('/auth/admin/list/').then(res => setUsers(res.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleActive = async (id) => {
    try {
      await api.post(`/auth/admin/${id}/toggle-active/`);
      showToast('User updated', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user', 'error');
    }
  };

  const toggleVerifier = async (id) => {
    try {
      await api.post(`/auth/admin/${id}/toggle-verifier/`);
      showToast('Verifier access updated', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update verifier access', 'error');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Users</h1>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
            borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ fontSize: '13px' }}>
              <strong>{u.username}</strong> · {u.email || '—'}
              {u.is_staff && <span style={{ color: 'var(--red)' }}> · ADMIN</span>}
              {u.is_verifier && !u.is_staff && <span style={{ color: '#2ecc71' }}> · VERIFIER</span>}
            </div>
            {!u.is_staff && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => toggleVerifier(u.id)}
                  className="btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  {u.is_verifier ? 'Revoke Verifier' : 'Make Verifier'}
                </button>
                <button
                  onClick={() => toggleActive(u.id)}
                  className="btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '12px', color: u.is_active ? 'var(--red)' : '#2ecc71', borderColor: u.is_active ? 'var(--red)' : '#2ecc71' }}
                >
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;