import { useState, useEffect } from 'react';

function WebSmashIntro({ children }) {
  const [phase, setPhase] = useState('web'); // web -> impact -> shatter -> done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('impact'), 900);
    const t2 = setTimeout(() => setPhase('shatter'), 1050);
    const t3 = setTimeout(() => setPhase('done'), 1750);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Radial + concentric spiderweb (real web pattern, not random lines)
  const center = { x: 200, y: 150 };
  const radials = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const x2 = center.x + Math.cos(angle) * 260;
    const y2 = center.y + Math.sin(angle) * 260;
    return { x1: center.x, y1: center.y, x2, y2 };
  });
  const rings = [50, 95, 145, 200];

  // Shatter shards: irregular triangles radiating from center
  const shards = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const spread = 40 + (i % 3) * 20;
    return {
      id: i,
      clip: `polygon(50% 50%, ${50 + Math.cos(angle) * 55}% ${50 + Math.sin(angle) * 55}%, ${50 + Math.cos(angle + 0.5) * 55}% ${50 + Math.sin(angle + 0.5) * 55}%)`,
      tx: Math.cos(angle) * 500,
      ty: Math.sin(angle) * 500,
      rot: (Math.random() - 0.5) * 180,
      delay: i * 0.02,
    };
  });

  return (
    <div style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
      <div style={{
        opacity: phase === 'done' ? 1 : 0,
        transition: 'opacity 0.35s ease-out',
      }}>
        {children}
      </div>

      {phase !== 'done' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 45%, #141a28 0%, #0b0f19 70%)',
          zIndex: 10,
          animation: phase === 'impact' ? 'shake 0.15s linear 2' : 'none',
        }}>
          {/* Flash on impact */}
          {phase === 'impact' && (
            <div style={{
              position: 'absolute', inset: 0, background: '#fff',
              animation: 'flash 0.15s ease-out forwards'
            }} />
          )}

          {/* Spiderweb (web + impact phases) */}
          {(phase === 'web' || phase === 'impact') && (
            <svg viewBox="0 0 400 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {radials.map((r, i) => (
                <line
                  key={`r-${i}`}
                  x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                  stroke="#dfe6ff" strokeWidth="1.4" filter="url(#glow)"
                  strokeDasharray="280" strokeDashoffset="280" opacity="0.85"
                  style={{ animation: `webDraw 0.45s cubic-bezier(.2,.7,.3,1) ${i * 0.03}s forwards` }}
                />
              ))}
              {rings.map((r, i) => (
                <circle
                  key={`c-${i}`}
                  cx={center.x} cy={center.y} r={r}
                  stroke="#dfe6ff" strokeWidth="1" fill="none" filter="url(#glow)"
                  strokeDasharray="1000" strokeDashoffset="1000" opacity="0.55"
                  style={{ animation: `webDraw 0.55s ease-out ${0.35 + i * 0.06}s forwards` }}
                />
              ))}
            </svg>
          )}

          <span style={{
            position: 'relative', color: '#e8ecff', fontSize: '15px', fontWeight: 700,
            letterSpacing: '4px', opacity: phase === 'web' ? 0 : 1,
            transition: 'opacity 0.2s',
            textShadow: '0 0 12px rgba(200,210,255,0.6)'
          }}>
            CINEMAX
          </span>

          {/* Shatter shards */}
          {phase === 'shatter' && shards.map(s => (
            <div key={s.id} style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #1c2336, #0b0f19)',
              clipPath: s.clip,
              transform: 'translate(0,0) rotate(0deg)',
              animation: `fly-${s.id} 0.65s cubic-bezier(.5,0,.9,.4) ${s.delay}s forwards`,
              opacity: 0.95,
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes webDraw { to { stroke-dashoffset: 0; } }
        @keyframes flash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
        @keyframes shake {
          0%, 100% { transform: translate(0,0); }
          25% { transform: translate(-3px, 2px); }
          50% { transform: translate(3px, -2px); }
          75% { transform: translate(-2px, -3px); }
        }
        ${shards.map(s => `
          @keyframes fly-${s.id} {
            to {
              transform: translate(${s.tx}px, ${s.ty}px) rotate(${s.rot}deg);
              opacity: 0;
            }
          }
        `).join('')}
      `}</style>
    </div>
  );
}

export default WebSmashIntro;