import { useState } from 'react'

const CATEGORIES = {
  mercado:    { label: 'Mercado',    icon: '🛒', color: '#4ade80' },
  farmacia:   { label: 'Farmácia',   icon: '💊', color: '#60a5fa' },
  suplemento: { label: 'Suplemento', icon: '💪', color: '#f472b6' },
  fruta:      { label: 'Fruta',      icon: '🍎', color: '#fb923c' },
  graos:      { label: 'Grãos',      icon: '🌾', color: '#facc15' },
}

export default function ItemCard({ item, onEdit, onDelete }) {
  const cat = CATEGORIES[item.category] || CATEGORIES.mercado
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className="card fade-in"
      style={{ padding: '18px 22px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        {/* Left: name + macros */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22 }}>{cat.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
              {item.brand && <div style={{ fontSize: 12, color: '#666' }}>{item.brand}</div>}
            </div>
            <span
              className="tag"
              style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
            >
              {cat.label}
            </span>
          </div>

          {/* Macro bars */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Prot', value: item.protein, max: 50, color: '#f472b6' },
              { label: 'Carb', value: item.carbs,   max: 100, color: '#facc15' },
              { label: 'Gord', value: item.fat,     max: 50, color: '#60a5fa' },
            ].map((m) => (
              <div key={m.label} style={{ minWidth: 72 }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 3 }}>
                  {m.label}{' '}
                  <span className="font-mono" style={{ color: m.color, fontSize: 11 }}>{m.value}g</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, width: 72 }}>
                  <div
                    style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                      background: m.color,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: stats + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: '#fb923c' }}>{item.calories}</div>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>kcal</div>
            <div style={{ fontSize: 10, color: '#555' }}>/{item.serving}{item.unit}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: '#f472b6' }}>{item.protein}g</div>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>proteína</div>
          </div>

          {item.price > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>
                R${item.price.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>preço</div>
            </div>
          )}

          {/* Actions */}
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: 12 }}
              >Não</button>
              <button
                onClick={() => onDelete(item.id)}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
              >Sim</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onEdit(item)}
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 14 }}
              >✏️</button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 14 }}
              >🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
