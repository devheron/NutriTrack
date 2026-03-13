export default function LoginPage({ onGoogle, onGithub }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.2)', marginBottom: 20 }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#00C896" strokeWidth="1.5"/>
              <path d="M8 12.5L11 15.5L16 9" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 8 }}>
            NutriTrack
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Gerencie sua nutrição com base em<br />mercados e farmácias da sua região
          </div>
        </div>

        {/* Auth card */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textAlign: 'center' }}>
            Entrar na conta
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Google */}
            <button
              onClick={onGoogle}
              style={{
                width: '100%', padding: '11px 18px', borderRadius: 9,
                background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                color: '#111', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10, transition: 'box-shadow .15s',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.2)'}
              onMouseOut={(e)  => e.currentTarget.style.boxShadow = 'none'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continuar com Google
            </button>

            {/* GitHub */}
            <button
              onClick={onGithub}
              style={{
                width: '100%', padding: '11px 18px', borderRadius: 9,
                background: '#24292e', border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 10, transition: 'background .15s',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2f363d'}
              onMouseOut={(e)  => e.currentTarget.style.background = '#24292e'}
            >
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continuar com GitHub
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Seus dados ficam salvos com segurança no Supabase.<br />
            Nenhuma senha é armazenada localmente.
          </p>
        </div>
      </div>
    </div>
  )
}
