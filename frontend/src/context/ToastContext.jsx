import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#3a1620' : t.type === 'success' ? '#123626' : 'var(--card)',
            border: `1px solid ${t.type === 'error' ? 'var(--red)' : t.type === 'success' ? '#2ecc71' : 'var(--border)'}`,
            color: 'var(--text)', padding: '14px 18px', borderRadius: '8px',
            minWidth: '240px', maxWidth: '320px', fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'toastIn 0.25s ease-out'
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}