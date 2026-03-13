import { useState, useRef } from 'react'
import { useLocation } from '../hooks/useLocation'
import { nearbyStores, detectUserLocation, isBorderRegion, COUNTRY_NAMES } from '../services/nearbyStores'
import Toast from '../components/Toast'

const TYPE_COLOR = { mercado: '#00C896', farmacia: '#3B82F6' }
const TYPE_LABEL = { mercado: 'Mercado', farmacia: 'Farmácia' }

const RADIUS_OPTIONS = [
  { v: 500,   l: '500 m'  },
  { v: 1000,  l: '1 km'   },
  { v: 2000,  l: '2 km'   },
  { v: 5000,  l: '5 km'   },
  { v: 10000, l: '10 km'  },
  { v: 15000, l: '15 km'  },
  { v: 20000, l: '20 km'  },
  { v: 25000, l: '25 km'  },
  { v: 30000, l: '30 km'  },
  { v: 35000, l: '35 km'  },
  { v: 40000, l: '40 km'  },
  { v: 45000, l: '45 km'  },
  { v: 50000, l: '50 km'  },
  { v: 55000, l: '55 km'  },
  { v: 60000, l: '60 km'  },
]

function Flag({ code }) {
  // Emoji de bandeira a partir do código ISO (funciona em todos os sistemas modernos)
  if (!code || code.length !== 2) return null
  const flag = code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  ).join('')
  return <span style={{ fontSize: 14 }}>{flag}</span>
}

function StoreCard({ store, userCountryCode }) {
  const color    = TYPE_COLOR[store.type] || '#00C896'
  const isAbroad = store.countryCode && store.countryCode !== userCountryCode
  const countryName = COUNTRY_NAMES[store.countryCode] || store.countryCode

  return (
    <div className="card card-hover" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{store.name}</span>
            <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
              {TYPE_LABEL[store.type]}
            </span>
            {store.brand && store.brand.toLowerCase() !== store.name.toLowerCase() && (
              <span className="badge" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {store.brand}
              </span>
            )}
            {/* País + cidade — SEMPRE mostra se tiver */}
            {store.countryCode && (
              <span className="badge" style={{
                background: isAbroad ? 'rgba(234,179,8,.1)' : 'rgba(0,200,150,.08)',
                color:      isAbroad ? 'var(--yellow)'      : 'var(--accent)',
                border:     `1px solid ${isAbroad ? 'rgba(234,179,8,.25)' : 'rgba(0,200,150,.2)'}`,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Flag code={store.countryCode} />
                {countryName}
              </span>
            )}
            {store.city && (
              <span className="badge" style={{ background: 'rgba(255,255,255,.04)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {store.city}
              </span>
            )}
          </div>

          {store.address && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{store.address}</div>
          )}
          {store.hours && (
            <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {store.hours}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
          {store.phone && (
            <a href={`tel:${store.phone}`} className="btn btn-ghost"
              style={{ padding: '5px 11px', fontSize: 12, textDecoration: 'none' }}>Ligar</a>
          )}
          <a href={`https://www.openstreetmap.org/?mlat=${store.lat}&mlon=${store.lng}&zoom=17`}
            target="_blank" rel="noreferrer" className="btn btn-blue"
            style={{ padding: '5px 11px', fontSize: 12, textDecoration: 'none' }}>Ver mapa</a>
        </div>
      </div>
    </div>
  )
}

export default function NearbyStores() {
  const { location, status, error, request } = useLocation()
  const [stores,       setStores]       = useState([])
  const [userGeo,      setUserGeo]      = useState(null)   // { countryCode, country, city }
  const [loading,      setLoading]      = useState(false)
  const [progressMsg,  setProgressMsg]  = useState('')
  const [radius,       setRadius]       = useState(2000)
  const [searched,     setSearched]     = useState(false)
  const [toast,        setToast]        = useState(null)
  // filtros
  const [filterType,    setFilterType]    = useState('all')   // all | mercado | farmacia
  const [filterCountry, setFilterCountry] = useState('all')   // all | BR | AR | PY ...
  const [filterCity,    setFilterCity]    = useState('all')   // all | <nome cidade>
  const didAutoSearch = useRef(false)

  const notify = (msg, type = 'error') => setToast({ msg, type })

  const doSearch = async (loc, r) => {
    setLoading(true)
    setSearched(true)
    setProgressMsg('Buscando estabelecimentos...')
    setFilterType('all')
    setFilterCountry('all')
    setFilterCity('all')

    try {
      // Detecta país/cidade do USUÁRIO pelas coordenadas (não pelo endereço!)
      setProgressMsg('Detectando seu país...')
      const geo = await detectUserLocation(loc.lat, loc.lng)
      setUserGeo(geo)

      // Busca lojas + resolve país de cada uma via reverse geocoding
      const data = await nearbyStores.fetch(loc.lat, loc.lng, r, (msg) => setProgressMsg(msg))
      setStores(data)

      // Avisa sobre fronteira
      const foreignCodes = [...new Set(data.map(s => s.countryCode).filter(c => c && c !== geo.countryCode))]
      if (foreignCodes.some(c => isBorderRegion(geo.countryCode, c))) {
        notify(
          `Região de fronteira: resultados de ${foreignCodes.map(c => COUNTRY_NAMES[c]||c).join(', ')} incluídos. Use os filtros abaixo.`,
          'success'
        )
      }

      if (data.length === 0) notify('Nenhum estabelecimento encontrado. Tente aumentar o raio.')
    } catch (e) {
      notify('Erro: ' + e.message)
    } finally {
      setLoading(false)
      setProgressMsg('')
    }
  }

  const handleSearch = () => {
    if (location) { doSearch(location, radius); return }
    request()
  }

  // Auto-busca ao obter localização
  if (status === 'success' && location && !didAutoSearch.current && !loading) {
    didAutoSearch.current = true
    doSearch(location, radius)
  }

  // ── Dados derivados para filtros ──────────────────────────────────────────
  const allCountries = [...new Set(stores.map(s => s.countryCode).filter(Boolean))].sort()

  // Normaliza cidade: sem acento, minúsculo, espaço simples
  const normCity = (c) => (c || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim()

  // Agrupa variantes ("foz do iguacu", "Foz do Iguaçu", "FOZ DO IGUACU") em uma só chave
  // e escolhe o nome mais frequente / com mais acentos para exibição
  const cityMap = (() => {
    const freq = {}
    stores
      .filter(s => filterCountry === 'all' || s.countryCode === filterCountry)
      .forEach(s => {
        if (!s.city) return
        const key = normCity(s.city)
        if (!freq[key]) freq[key] = {}
        freq[key][s.city] = (freq[key][s.city] || 0) + 1
      })
    const result = {}
    for (const [key, counts] of Object.entries(freq)) {
      // Mais frequente primeiro; em empate, prefere o que tem mais caracteres especiais (acentos)
      result[key] = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0]
    }
    return result // { normKey -> displayName }
  })()

  const allCities = Object.entries(cityMap)
    .sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'))
    // [normKey, displayName]

  const displayed = stores.filter(s => {
    if (filterType    !== 'all' && s.type              !== filterType)    return false
    if (filterCountry !== 'all' && s.countryCode       !== filterCountry) return false
    if (filterCity    !== 'all' && normCity(s.city)    !== filterCity)    return false
    return true
  })

  const countByType = (t) => displayed.filter(s => s.type === t).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.5px' }}>Mercados e Farmácias</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          Estabelecimentos próximos · país detectado pelas coordenadas GPS
        </p>
      </div>

      {/* ── Controles ── */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Status da localização */}
          <div style={{ flex: 1, minWidth: 180 }}>
            {status === 'idle' && <span style={{ fontSize: 13, color: 'var(--text3)' }}>Localização não obtida</span>}
            {status === 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                <div className="spin" style={{ width: 13, height: 13, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
                Obtendo GPS...
              </div>
            )}
            {status === 'success' && location && userGeo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{location.display}</span>
                <span className="badge" style={{ background: 'rgba(0,200,150,.1)', color: 'var(--accent)', border: '1px solid rgba(0,200,150,.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flag code={userGeo.countryCode} /> {COUNTRY_NAMES[userGeo.countryCode] || userGeo.countryCode}
                </span>
              </div>
            )}
            {status === 'success' && location && !userGeo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{location.display}</span>
              </div>
            )}
            {(status === 'denied' || status === 'error') && (
              <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>
            )}
          </div>

          {/* Raio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Raio:</label>
            <select className="field" value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: 'auto' }}>
              {RADIUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>

          <button className="btn btn-accent" onClick={handleSearch} disabled={loading || status === 'loading'}>
            {loading ? (
              <><div className="spin" style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#040810', borderRadius: '50%' }} />{progressMsg || 'Buscando...'}</>
            ) : (
              <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
              </svg>{location ? 'Buscar' : 'Usar minha localização'}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Filtros (só quando tem resultados) ── */}
      {stores.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>

          {/* Linha 1: tipo */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginRight: 4 }}>Tipo</span>
            {[
              { id: 'all',      label: `Todos (${displayed.length})`,             color: 'var(--text2)' },
              { id: 'mercado',  label: `Mercados (${countByType('mercado')})`,    color: '#00C896' },
              { id: 'farmacia', label: `Farmácias (${countByType('farmacia')})`,  color: '#3B82F6' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)} style={{
                padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                border: filterType === f.id ? `1px solid ${f.color}` : '1px solid var(--border)',
                background: filterType === f.id ? `${f.color}15` : 'transparent',
                color: filterType === f.id ? f.color : 'var(--text2)',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Linha 2: país — só se tiver mais de 1 país */}
          {allCountries.length > 1 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginRight: 4 }}>País</span>
              <button onClick={() => { setFilterCountry('all'); setFilterCity('all') }} style={{
                padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                border: filterCountry === 'all' ? '1px solid var(--text2)' : '1px solid var(--border)',
                background: filterCountry === 'all' ? 'rgba(255,255,255,.08)' : 'transparent',
                color: filterCountry === 'all' ? 'var(--text)' : 'var(--text2)',
              }}>Todos</button>
              {allCountries.map(code => {
                const isUser   = code === userGeo?.countryCode
                const color    = isUser ? 'var(--accent)' : 'var(--yellow)'
                const selected = filterCountry === code
                return (
                  <button key={code} onClick={() => { setFilterCountry(code); setFilterCity('all') }} style={{
                    padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    border: selected ? `1px solid ${color}` : '1px solid var(--border)',
                    background: selected ? `${color === 'var(--accent)' ? 'rgba(0,200,150' : 'rgba(234,179,8'},.12)` : 'transparent',
                    color: selected ? color : 'var(--text2)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Flag code={code} />{COUNTRY_NAMES[code] || code}
                    {isUser && <span style={{ fontSize: 9, opacity: .6 }}>você</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Linha 3: cidade — só se tiver mais de 1 cidade */}
          {allCities.length > 1 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginRight: 4 }}>Cidade</span>
              <button onClick={() => setFilterCity('all')} style={{
                padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                border: filterCity === 'all' ? '1px solid var(--text2)' : '1px solid var(--border)',
                background: filterCity === 'all' ? 'rgba(255,255,255,.08)' : 'transparent',
                color: filterCity === 'all' ? 'var(--text)' : 'var(--text2)',
              }}>Todas</button>
              {allCities.map(([normKey, displayName]) => (
                <button key={normKey} onClick={() => setFilterCity(normKey)} style={{
                  padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  border: filterCity === normKey ? '1px solid #a78bfa' : '1px solid var(--border)',
                  background: filterCity === normKey ? 'rgba(167,139,250,.12)' : 'transparent',
                  color: filterCity === normKey ? '#a78bfa' : 'var(--text2)',
                }}>{displayName}</button>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {displayed.length} resultado{displayed.length !== 1 ? 's' : ''}
            {filterCountry !== 'all' || filterCity !== 'all' || filterType !== 'all' ? (
              <button onClick={() => { setFilterType('all'); setFilterCountry('all'); setFilterCity('all') }}
                style={{ marginLeft: 10, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 14px' }} />
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{progressMsg}</div>
        </div>
      ) : displayed.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {displayed.map((s, i) => (
            <div key={s.id} className="fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
              <StoreCard store={s} userCountryCode={userGeo?.countryCode} />
            </div>
          ))}
        </div>
      ) : searched && !loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Nenhum resultado com os filtros atuais.</div>
          <button className="btn btn-ghost" onClick={() => { setFilterType('all'); setFilterCountry('all'); setFilterCity('all') }}>Limpar filtros</button>
        </div>
      ) : status === 'idle' ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Permita o acesso à localização para buscar mercados e farmácias próximos.</div>
          <button className="btn btn-accent" onClick={request}>Permitir localização</button>
        </div>
      ) : null}
    </div>
  )
}
