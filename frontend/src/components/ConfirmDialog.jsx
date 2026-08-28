function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '24px', maxWidth: '380px', width: '100%'
      }}>
        <h3 style={{ marginBottom: '10px', fontSize: '17px' }}>{title}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;