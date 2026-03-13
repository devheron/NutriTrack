import { useState } from 'react'

const CAT = {
  mercado:    '#00C896',
  farmacia:   '#3B82F6',
  suplemento: '#EC4899',
  proteina:   '#F97316',
  graos:      '#EAB308',
}

export default function ProductCard({ item, onEdit, onDelete, onAddToDay }) {
  const [confirm, setConfirm] = useState(false)
  const [imgErr,  setImgErr]  = useState(false)
  const color = CAT[item.category] || '#00C896'
  const img   = (!imgErr && item.photo_url) ? item.photo_url : null

  return (
    <div className="card card-hover" style={{ display: 'flex', overflow: 'hidden' }}>
      {/* accent strip */}
      <div style={{ width: 3, background: color, flexShrink: 0 }} />

      {/* image */}
      <div style={{ width: 86, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {img ? (
          <img src={img} alt={item.name} onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.1)" strokeWidth="1.5">
            <rect x="3" y="6" width="18" height="14" rx="2"/>
            <circle cx="9" cy="12" r="2.5"/><path d="M15 17l-3-3-3 3"/>
          </svg>
        )}
      </div>

      {/* content */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}25`, flexShrink: 0 }}>
                {item.store || item.category}
              </span>
              {item.source === 'openfoodfacts' && (
                <span className="badge" style={{ background: 'rgba(59,130,246,.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.2)', flexShrink: 0 }}>
                  OFF
                </span>
              )}
            </div>
            {item.brand && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{item.brand}</div>}
            {item.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, lineHeight: 1.4 }}>{item.description}</div>}
          </div>
          {item.price > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>R${item.price.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>/{item.serving}{item.unit}</div>
            </div>
          )}
        </div>

        {/* macros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { l: 'Calorias', v: item.calories, u: 'kcal', c: 'var(--orange)', pct: (item.calories / 600) * 100 },
            { l: 'Proteína', v: item.protein,  u: 'g',    c: 'var(--pink)',   pct: (item.protein  / 50)  * 100 },
            { l: 'Carbs',    v: item.carbs,    u: 'g',    c: 'var(--yellow)', pct: (item.carbs    / 100) * 100 },
            { l: 'Gordura',  v: item.fat,      u: 'g',    c: 'var(--blue)',   pct: (item.fat      / 50)  * 100 },
          ].map((m) => (
            <div key={m.l}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{m.l}</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: m.c }}>{m.v}<span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 1 }}>{m.u}</span></span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${Math.min(m.pct, 100)}%`, background: m.c }} />
              </div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Por {item.serving}{item.unit}</span>
          <div style={{ display: 'flex', gap: 7 }}>
            {confirm ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--text2)', alignSelf: 'center' }}>Remover?</span>
                <button className="btn btn-ghost" style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => setConfirm(false)}>Não</button>
                <button className="btn btn-danger" style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => onDelete(item.id)}>Sim</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost"  style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => onEdit(item)}>Editar</button>
                <button className="btn btn-ghost"  style={{ padding: '5px 11px', fontSize: 12, color: '#f87171' }} onClick={() => setConfirm(true)}>Remover</button>
                <button className="btn btn-accent" style={{ padding: '5px 13px', fontSize: 12 }} onClick={() => onAddToDay(item)}>+ Adicionar ao dia</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
