import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',        label: 'Alimentos'    },
  { to: '/stores',  label: 'Mercados'     },
  { to: '/daily',   label: 'Plano do Dia' },
  { to: '/schedule',label: 'Agendamentos' },
]

export default function Navbar({ user, onSignOut }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(7,9,12,.92)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#00C896" strokeWidth="1.5"/>
            <path d="M8 12.5L11 15.5L16 9" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--text)', letterSpacing: '-.2px' }}>
            NutriTrack
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              style={({ isActive }) => ({
                padding: '5px 12px', borderRadius: 7, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text)' : 'var(--text2)',
                background: isActive ? 'rgba(255,255,255,.07)' : 'transparent',
                textDecoration: 'none', transition: 'all .15s',
              })}
            >{t.label}</NavLink>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border2)' }} />
            )}
            <span style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.user_metadata?.full_name || user.email}
            </span>
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={onSignOut}>
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
