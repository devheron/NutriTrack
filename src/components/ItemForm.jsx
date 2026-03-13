import { useState, useEffect, useRef } from 'react'
import { openFoodFacts } from '../services/openFoodFacts'

const CATS  = ['mercado','farmacia','suplemento','proteina','graos']
const UNITS = ['g','ml','un','colher (sopa)','xícara']
const STORES= ['Mercado','Farmácia','Supermercado','Loja de Suplementos','Online']

const EMPTY = {
  name:'',brand:'',category:'mercado',store:'Mercado',
  calories:'',protein:'',carbs:'',fat:'',
  serving:'100',unit:'g',price:'',photo_url:'',description:'',
}

export default function ItemForm({ editItem, onSave, onCancel }) {
  const [form,    setForm]    = useState(EMPTY)
  const [errors,  setErrors]  = useState({})
  const [preview, setPreview] = useState(null)
  const [search,  setSearch]  = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const fileRef = useRef()
  const searchTimer = useRef()

  useEffect(() => {
    if (editItem) {
      setForm({ ...EMPTY, ...editItem,
        calories: String(editItem.calories ?? ''),
        protein:  String(editItem.protein  ?? ''),
        carbs:    String(editItem.carbs    ?? ''),
        fat:      String(editItem.fat      ?? ''),
        serving:  String(editItem.serving  ?? 100),
        price:    String(editItem.price    ?? ''),
      })
      setPreview(editItem.photo_url || null)
    } else {
      setForm(EMPTY); setPreview(null)
    }
    setErrors({}); setResults([])
  }, [editItem])

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  // Busca debounced no Open Food Facts
  const handleSearch = (q) => {
    setSearch(q)
    clearTimeout(searchTimer.current)
    if (q.length < 3) { setResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const r = await openFoodFacts.search(q)
      setResults(r.slice(0, 8))
      setSearching(false)
    }, 500)
  }

  const applyResult = (p) => {
    setForm((prev) => ({
      ...prev,
      name:     p.name     || prev.name,
      brand:    p.brand    || prev.brand,
      category: p.category || prev.category,
      calories: String(p.calories),
      protein:  String(p.protein),
      carbs:    String(p.carbs),
      fat:      String(p.fat),
      serving:  String(p.serving),
      unit:     p.unit || 'g',
      photo_url: p.photo_url || prev.photo_url,
      description: p.description || prev.description,
      barcode:  p.barcode || prev.barcode,
      source:   'openfoodfacts',
    }))
    setPreview(p.photo_url || null)
    setResults([]); setSearch('')
  }

  const handlePhotoFile = (e) => {
    const file = e.target.files[0]; if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name     = 'Obrigatório'
    if (!form.calories)     e.calories = 'Obrigatório'
    if (!form.protein)      e.protein  = 'Obrigatório'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      ...form,
      calories: +form.calories || 0,
      protein:  +form.protein  || 0,
      carbs:    +form.carbs    || 0,
      fat:      +form.fat      || 0,
      serving:  +form.serving  || 100,
      price:    +form.price    || 0,
      _photoFile: photoFile,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Open Food Facts search */}
      <div style={{ position: 'relative' }}>
        <label className="lbl">Buscar produto (Open Food Facts)</label>
        <div style={{ position: 'relative' }}>
          <input
            className="field"
            placeholder="Digite o nome do produto para buscar automaticamente..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <div className="spin" style={{ width: 14, height: 14, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
            </div>
          )}
        </div>
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--border2)',
            borderRadius: 9, marginTop: 4, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          }}>
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => applyResult(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseOut={(e)  => e.currentTarget.style.background = 'transparent'}
              >
                {r.photo_url ? (
                  <img src={r.photo_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--surface2)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.brand} · {r.calories} kcal · {r.protein}g prot</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo + name */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          onClick={() => fileRef.current.click()}
          style={{ width: 88, height: 88, borderRadius: 10, flexShrink: 0, background: 'var(--surface2)', border: '1.5px dashed var(--border2)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="lbl">Nome *</label>
            <input className="field" placeholder="ex: Aveia em Flocos" value={form.name} onChange={(e) => f('name', e.target.value)} style={errors.name ? { borderColor: 'var(--red)' } : {}} />
            {errors.name && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 3, display: 'block' }}>{errors.name}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="lbl">Marca</label>
              <input className="field" placeholder="ex: Quaker" value={form.brand} onChange={(e) => f('brand', e.target.value)} />
            </div>
            <div>
              <label className="lbl">Loja</label>
              <select className="field" value={form.store} onChange={(e) => f('store', e.target.value)}>
                {STORES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="lbl">Categoria</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => f('category', c)}
              style={{ padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                border: form.category === c ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: form.category === c ? 'rgba(0,200,150,.1)' : 'transparent',
                color: form.category === c ? 'var(--accent)' : 'var(--text2)',
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      <div>
        <label className="lbl" style={{ marginBottom: 9 }}>Informação nutricional</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { k: 'calories', l: 'Calorias (kcal) *', ph: '361',  c: 'var(--orange)' },
            { k: 'protein',  l: 'Proteína (g) *',    ph: '13.9', c: 'var(--pink)'   },
            { k: 'carbs',    l: 'Carboidratos (g)',  ph: '58',   c: 'var(--yellow)' },
            { k: 'fat',      l: 'Gorduras (g)',      ph: '7',    c: 'var(--blue)'   },
          ].map((fd) => (
            <div key={fd.k}>
              <label className="lbl">{fd.l}</label>
              <input className="field" type="number" min="0" step=".1" placeholder={fd.ph}
                value={form[fd.k]} onChange={(e) => f(fd.k, e.target.value)}
                style={errors[fd.k] ? { borderColor: 'var(--red)' } : form[fd.k] ? { borderColor: `${fd.c}60` } : {}} />
              {errors[fd.k] && <span style={{ fontSize: 11, color: 'var(--red)', display: 'block', marginTop: 3 }}>{errors[fd.k]}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Serving + price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div><label className="lbl">Porção</label><input className="field" type="number" min="1" placeholder="100" value={form.serving} onChange={(e) => f('serving', e.target.value)} /></div>
        <div><label className="lbl">Unidade</label><select className="field" value={form.unit} onChange={(e) => f('unit', e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
        <div><label className="lbl">Preço (R$)</label><input className="field" type="number" min="0" step=".01" placeholder="0,00" value={form.price} onChange={(e) => f('price', e.target.value)} /></div>
      </div>

      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost"  onClick={onCancel}>Cancelar</button>
        <button className="btn btn-accent" onClick={handleSave}>{editItem ? 'Salvar alterações' : 'Adicionar produto'}</button>
      </div>
    </div>
  )
}
