import { useEffect } from 'react'
export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
  const ok = type === 'success'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? 'rgba(0,200,150,.1)' : 'rgba(239,68,68,.1)',
      border: `1px solid ${ok ? 'rgba(0,200,150,.3)' : 'rgba(239,68,68,.3)'}`,
      color: ok ? 'var(--accent)' : '#f87171',
      borderRadius: 10, padding: '11px 18px',
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      animation: 'fadeIn .2s ease', maxWidth: 320,
    }}>
      {message}
    </div>
  )
}
