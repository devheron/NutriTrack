import { useState, useEffect, useCallback } from 'react'
import { foodItemsService } from '../services/foodItems'
import ProductCard  from '../components/ProductCard'
import ItemForm     from '../components/ItemForm'
import AddToDayModal from '../components/AddToDayModal'
import Toast        from '../components/Toast'
import { dailyLogsService } from '../services/dailyLogs'

const todayStr = () => new Date().toISOString().split('T')[0]

const CATS = [
  { id: 'all',       label: 'Todos',      color: 'var(--text2)' },
  { id: 'mercado',   label: 'Mercado',    color: '#00C896' },
  { id: 'farmacia',  label: 'Farmácia',   color: '#3B82F6' },
  { id: 'suplemento',label: 'Suplemento', color: '#EC4899' },
  { id: 'proteina',  label: 'Proteína',   color: '#F97316' },
  { id: 'graos',     label: 'Grãos',      color: '#EAB308' },
]

export default function FoodBank() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [cat,       setCat]       = useState('all')
  const [sortBy,    setSortBy]    = useState('protein')
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [addTarget, setAddTarget] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)

  const notify = (msg, type = 'success') => setToast({ msg, type })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await foodItemsService.getAll()
      setItems(data)
    } catch (e) {
      notify('Erro ao carregar produtos: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items
    .filter((i) => cat === 'all' || i.category === cat)
    .filter((i) => {
      const q = search.toLowerCase()
      return i.name.toLowerCase().includes(q) || (i.brand || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'protein')  return b.protein  - a.protein
      if (sortBy === 'calories') return b.calories - a.calories
      if (sortBy === 'price')    return a.price    - b.price
      return a.name.localeCompare(b.name)
    })

  const topProtein  = [...items].sort((a, b) => b.protein  - a.protein).slice(0, 3)
  const topCalories = [...items].sort((a, b) => b.calories - a.calories).slice(0, 3)

  const handleSave = async (data) => {
    setSaving(true)
    try {
      let photoUrl = data.photo_url
      // Upload foto se houver arquivo novo
      if (data._photoFile) {
        const tmpId = editItem?.id || 'new_' + Date.now()
        photoUrl = await foodItemsService.uploadPhoto(data._photoFile, tmpId)
      }
      const { _photoFile, ...payload } = data
      payload.photo_url = photoUrl

      if (editItem) {
        await foodItemsService.update(editItem.id, payload)
        notify(`"${data.name}" atualizado`)
      } else {
        await foodItemsService.create(payload)
        notify(`"${data.name}" adicionado`)
      }
      await load()
      setShowForm(false); setEditItem(null)
    } catch (e) {
      notify('Erro ao salvar: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await foodItemsService.remove(id)
      setItems((p) => p.filter((i) => i.id !== id))
      notify('Produto removido', 'error')
    } catch (e) {
      notify('Erro ao remover: ' + e.message, 'error')
    }
  }

  const handleConfirmAdd = async (entry) => {
    try {
      await dailyLogsService.add({ item_id: addTarget.id, log_date: todayStr(), ...entry })
      notify('Adicionado ao plano de hoje')
      setAddTarget(null)
    } catch (e) {
      notify('Erro: ' + e.message, 'error')
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {toast      && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {addTarget  && <AddToDayModal item={addTarget} onConfirm={handleConfirmAdd} onClose={() => setAddTarget(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--text)' }}>Banco de Alimentos</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Seus produtos salvos com segurança no Supabase</p>
        </div>
        <button className="btn btn-accent" onClick={() => { setEditItem(null); setShowForm(true) }}>+ Novo produto</button>
      </div>

      {/* Highlights */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {[
            { title: 'Mais proteína / porção', list: topProtein,  key: 'protein',  u: 'g',    c: 'var(--pink)'   },
            { title: 'Mais calóricos',         list: topCalories, key: 'calories', u: 'kcal', c: 'var(--orange)' },
          ].map((g) => (
            <div key={g.title} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase', color: g.c, marginBottom: 14 }}>{g.title}</div>
              {g.list.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }} onClick={() => setAddTarget(item)}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text3)', width: 14 }}>{i + 1}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--surface2)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.brand || item.store}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: g.c }}>{item[g.key]}<span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 1 }}>{g.u}</span></span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 9, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input className="field" placeholder="Buscar produto ou marca..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="field" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
          <option value="protein">Proteína</option>
          <option value="calories">Calorias</option>
          <option value="price">Preço</option>
          <option value="name">Nome</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: '4px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            border: cat === c.id ? `1px solid ${c.color}` : '1px solid var(--border)',
            background: cat === c.id ? `${c.color}15` : 'transparent',
            color: cat === c.id ? c.color : 'var(--text2)',
          }}>{c.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card slide-up" style={{ padding: 26, marginBottom: 18, borderColor: 'rgba(0,200,150,.15)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20, color: 'var(--text)' }}>
            {editItem ? 'Editar produto' : 'Novo produto'}
          </div>
          {saving && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>Salvando no Supabase...</div>}
          <ItemForm editItem={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null) }} />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Carregando do Supabase...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
            {items.length === 0 ? 'Nenhum produto cadastrado ainda' : 'Nenhum resultado para sua busca'}
          </div>
          {items.length === 0 && <button className="btn btn-accent" onClick={() => { setEditItem(null); setShowForm(true) }}>+ Adicionar primeiro produto</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {filtered.map((item, i) => (
            <div key={item.id} className="fade-in" style={{ animationDelay: `${i * 0.025}s` }}>
              <ProductCard item={item} onEdit={(it) => { setEditItem(it); setShowForm(true) }} onDelete={handleDelete} onAddToDay={setAddTarget} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
