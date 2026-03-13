import { useState } from 'react'

const MEALS = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Pré-treino', 'Pós-treino']

export default function AddToDayModal({ item, onConfirm, onClose }) {
  const [meal, setMeal]     = useState(MEALS[0])
  const [qty,  setQty]      = useState(String(item.serving))
  const q   = +qty || item.serving
  const r   = q / item.serving
  const pre = {
    cal:  Math.round(item.calories * r),
    prot: +(item.protein * r).toFixed(1),
    carb: +(item.carbs   * r).toFixed(1),
    fat:  +(item.fat     * r).toFixed(1),
  }

  return (
    <div className="overlay">
      <div className="card slide-up" style={{ width: '100%', maxWidth: 420, padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Adicionar ao plano</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label className="lbl">Refeição</label>
            <select className="field" value={meal} onChange={(e) => setMeal(e.target.value)}>
              {MEALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Quantidade ({item.unit})</label>
            <input className="field" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={String(item.serving)} />
          </div>

          {/* preview */}
          <div style={{ background: 'rgba(0,200,150,.05)', border: '1px solid rgba(0,200,150,.12)', borderRadius: 9, padding: '13px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
              Valores para {q}{item.unit}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { l: 'Calorias', v: pre.cal,  u: 'kcal', c: 'var(--orange)' },
                { l: 'Proteína', v: pre.prot, u: 'g',    c: 'var(--pink)'   },
                { l: 'Carbs',    v: pre.carb, u: 'g',    c: 'var(--yellow)' },
                { l: 'Gordura',  v: pre.fat,  u: 'g',    c: 'var(--blue)'   },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}<span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 1 }}>{s.u}</span></div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost"  onClick={onClose}>Cancelar</button>
            <button className="btn btn-accent" onClick={() => onConfirm({
              meal, quantity: q,
              snap_calories: pre.cal, snap_protein: pre.prot,
              snap_carbs: pre.carb,  snap_fat: pre.fat,
            })}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
