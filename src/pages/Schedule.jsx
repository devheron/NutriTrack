import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { foodItemsService } from '../services/foodItems'
import { dailyLogsService } from '../services/dailyLogs'
import Toast from '../components/Toast'

const MEALS    = ['Café da manhã','Almoço','Lanche','Jantar','Pré-treino','Pós-treino']
const todayStr = () => new Date().toISOString().split('T')[0]
const fmtShort = (d) => new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})

function next14() {
  return Array.from({length:14},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()+i)
    return d.toISOString().split('T')[0]
  })
}

export default function Schedule() {
  const [items,    setItems]    = useState([])
  const [plans,    setPlans]    = useState({})
  const [selected, setSelected] = useState(null)
  const [draft,    setDraft]    = useState([])
  const [newE,     setNewE]     = useState({ itemId:'', meal:MEALS[0], quantity:'' })
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const days = next14()

  const notify = (msg, type='success') => setToast({ msg, type })

  useEffect(() => {
    foodItemsService.getAll().then(setItems)
    loadPlans()
  }, [])

  const loadPlans = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    const from = days[0], to = days[days.length-1]
    const { data, error } = await supabase
      .from('scheduled_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('plan_date', from)
      .lte('plan_date', to)
    if (error || !data) return
    const grouped = {}
    data.forEach(r => {
      if (!grouped[r.plan_date]) grouped[r.plan_date] = []
      grouped[r.plan_date].push(r)
    })
    setPlans(grouped)
  }

  const openDay = (d) => {
    setSelected(d)
    // item_id é UUID string — NÃO converte para número
    setDraft(plans[d] ? plans[d].map(r => ({ ...r, _tempId: r.id })) : [])
    setNewE({ itemId:'', meal:MEALS[0], quantity:'' })
  }

  const addEntry = () => {
    if (!newE.itemId || !newE.quantity) { notify('Preencha o produto e a quantidade','error'); return }
    const item = items.find(i => i.id === newE.itemId)
    if (!item) { notify('Produto não encontrado','error'); return }
    setDraft(p => [...p, {
      _tempId:  Date.now(),
      item_id:  newE.itemId,   // UUID string — mantém como string
      meal:     newE.meal,
      quantity: +newE.quantity,
    }])
    setNewE(p => ({ ...p, itemId:'', quantity:'' }))
  }

  const savePlan = async () => {
    setSaving(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { notify('Sessão expirada','error'); return }
      await supabase.from('scheduled_plans').delete()
        .eq('plan_date', selected).eq('user_id', user.id)
      if (draft.length > 0) {
        const rows = draft.map(e => ({
          user_id:    user.id,
          plan_date:  selected,
          item_id:    e.item_id,
          meal:       e.meal,
          quantity:   e.quantity,
        }))
        const { error } = await supabase.from('scheduled_plans').insert(rows)
        if (error) throw error
      }
      notify(`Plano salvo para ${fmtShort(selected)}`)
      await loadPlans()
      setSelected(null)
    } catch(e) {
      notify('Erro ao salvar: '+e.message,'error')
    } finally {
      setSaving(false)
    }
  }

  const removePlan = async (d) => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('scheduled_plans').delete()
      .eq('plan_date', d).eq('user_id', user.id)
    notify('Plano removido','error')
    await loadPlans()
  }

  const applyToday = async (d) => {
    const entries = plans[d] || []
    let count = 0
    for (const e of entries) {
      const item = items.find(i => i.id === e.item_id)
      if (!item) continue
      const r = e.quantity / item.serving
      await dailyLogsService.add({
        item_id:       item.id,
        log_date:      todayStr(),
        meal:          e.meal,
        quantity:      e.quantity,
        snap_calories: Math.round(item.calories * r),
        snap_protein:  +(item.protein * r).toFixed(1),
        snap_carbs:    +(item.carbs   * r).toFixed(1),
        snap_fat:      +(item.fat     * r).toFixed(1),
      })
      count++
    }
    notify(`${count} item${count!==1?'s':''} aplicado${count!==1?'s':''} no plano de hoje`)
  }

  // Calcula totais de uma lista de entradas do plano
  const calcTotal = (entries) => entries.reduce((acc, e) => {
    const item = items.find(i => i.id === e.item_id)
    if (!item) return acc
    const r = e.quantity / item.serving
    return {
      cal:  acc.cal  + Math.round(item.calories * r),
      prot: +(acc.prot + item.protein * r).toFixed(1),
    }
  }, { cal:0, prot:0 })

  // Agrupa draft por refeição para exibição no modal
  const draftByMeal = MEALS.reduce((acc, m) => {
    acc[m] = draft.filter(e => e.meal === m)
    return acc
  }, {})

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-.5px', color:'var(--text)' }}>Agendamentos</h1>
        <p style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>Próximos 14 dias · clique em um dia para editar</p>
      </div>

      {/* ── Modal de edição do dia ── */}
      {selected && (
        <div className="overlay">
          <div className="card slide-up" style={{ width:'100%', maxWidth:500, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            {/* Header */}
            <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{fmtShort(selected)}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{draft.length} item{draft.length!==1?'s':''}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:22,lineHeight:1 }}>×</button>
            </div>

            <div style={{ flex:1, overflow:'auto', padding:'16px 22px' }}>
              {/* Formulário de adição */}
              <div style={{ background:'var(--surface2)', borderRadius:9, padding:14, marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.4px', textTransform:'uppercase', color:'var(--accent)', marginBottom:11 }}>
                  Adicionar item
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  <select className="field" value={newE.meal} onChange={e=>setNewE(p=>({...p,meal:e.target.value}))}>
                    {MEALS.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <select className="field" value={newE.itemId} onChange={e=>setNewE(p=>({...p,itemId:e.target.value}))}>
                    <option value="">Selecionar produto...</option>
                    {items.map(i=><option key={i.id} value={i.id}>{i.name}{i.brand?` · ${i.brand}`:''}</option>)}
                  </select>
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="field" type="number" min="1" placeholder={`Qtd (g/ml/un)`}
                      value={newE.quantity} onChange={e=>setNewE(p=>({...p,quantity:e.target.value}))} style={{ flex:1 }} />
                    <button className="btn btn-accent" onClick={addEntry}>+ Adicionar</button>
                  </div>
                </div>
              </div>

              {/* Lista de itens agrupados por refeição */}
              {draft.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:'var(--text3)' }}>
                  Nenhum item adicionado ainda
                </div>
              ) : (
                MEALS.map(meal => {
                  const entries = draftByMeal[meal]
                  if (!entries.length) return null
                  const mTotal = calcTotal(entries)
                  return (
                    <div key={meal} style={{ marginBottom:14 }}>
                      {/* Cabeçalho da refeição */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, padding:'5px 10px', background:'rgba(255,255,255,.04)', borderRadius:7 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.4px' }}>{meal}</span>
                        <div style={{ display:'flex', gap:10 }}>
                          <span className="mono" style={{ fontSize:11, color:'var(--orange)' }}>{mTotal.cal} kcal</span>
                          <span className="mono" style={{ fontSize:11, color:'var(--pink)'   }}>{mTotal.prot}g</span>
                        </div>
                      </div>
                      {/* Itens da refeição */}
                      {entries.map(e => {
                        const item = items.find(i => i.id === e.item_id)
                        if (!item) return null
                        const r    = e.quantity / item.serving
                        const cal  = Math.round(item.calories * r)
                        const prot = +(item.protein * r).toFixed(1)
                        return (
                          <div key={e._tempId} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:7, marginBottom:5, background:'var(--surface2)' }}>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                              <div style={{ fontSize:11, color:'var(--text3)' }}>{e.quantity}{item.unit}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                              <span className="mono" style={{ fontSize:12, color:'var(--orange)' }}>{cal} kcal</span>
                              <span className="mono" style={{ fontSize:12, color:'var(--pink)'   }}>{prot}g</span>
                              <button onClick={()=>setDraft(p=>p.filter(x=>x._tempId!==e._tempId))}
                                style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:18,lineHeight:1,padding:'2px 4px',borderRadius:4,transition:'color .15s' }}
                                onMouseOver={ev=>ev.target.style.color='var(--red)'}
                                onMouseOut={ev=>ev.target.style.color='var(--text3)'}
                              >×</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}

              {/* Total geral */}
              {draft.length > 0 && (() => {
                const t = calcTotal(draft)
                return (
                  <div style={{ padding:'10px 14px', background:'rgba(0,200,150,.06)', border:'1px solid rgba(0,200,150,.14)', borderRadius:8, display:'flex', gap:20, marginTop:4 }}>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>Total do dia:</span>
                    <span className="mono" style={{ fontSize:14, fontWeight:700, color:'var(--orange)' }}>{t.cal} kcal</span>
                    <span className="mono" style={{ fontSize:14, fontWeight:700, color:'var(--pink)'   }}>{t.prot}g prot</span>
                  </div>
                )
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:9, justifyContent:'flex-end', flexShrink:0 }}>
              <button className="btn btn-ghost"  onClick={()=>setSelected(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-accent" onClick={savePlan} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar plano'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grade de dias ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:11 }}>
        {days.map(d => {
          const plan    = plans[d] || []
          const isToday = d === todayStr()
          const t       = calcTotal(plan)

          // Lista refeições únicas do dia para preview
          const mealsInDay = [...new Set(plan.map(e => e.meal))]

          return (
            <div key={d} className="card card-hover" onClick={()=>openDay(d)}
              style={{ padding:16, cursor:'pointer',
                borderColor: isToday ? 'rgba(0,200,150,.3)' : plan.length>0 ? 'rgba(59,130,246,.25)' : undefined,
              }}>
              {/* Data */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.4px', textTransform:'uppercase', color:isToday?'var(--accent)':'var(--text3)' }}>
                  {isToday ? 'Hoje' : new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short'})}
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>
                  {new Date(d+'T12:00').getDate()}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  {new Date(d+'T12:00').toLocaleDateString('pt-BR',{month:'short'})}
                </div>
              </div>

              {plan.length > 0 ? (
                <>
                  {/* Totais */}
                  <div className="mono" style={{ fontSize:12, color:'var(--orange)', marginBottom:1 }}>{t.cal} kcal</div>
                  <div className="mono" style={{ fontSize:11, color:'var(--pink)',   marginBottom:8 }}>{t.prot}g prot</div>

                  {/* Refeições do dia */}
                  <div style={{ marginBottom:10 }}>
                    {mealsInDay.map(meal => {
                      const mEntries = plan.filter(e => e.meal === meal)
                      const mItems   = mEntries.map(e => items.find(i => i.id === e.item_id)).filter(Boolean)
                      const mCal     = calcTotal(mEntries).cal
                      return (
                        <div key={meal} style={{ marginBottom:5 }}>
                          <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:2 }}>
                            {meal}
                          </div>
                          {mEntries.map((e, i) => {
                            const item = mItems[i]
                            if (!item) return null
                            return (
                              <div key={e._tempId||e.id} style={{ fontSize:11, color:'var(--text2)', display:'flex', justifyContent:'space-between' }}>
                                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:4 }}>{item.name}</span>
                                <span className="mono" style={{ fontSize:10, color:'var(--text3)', flexShrink:0 }}>{e.quantity}{item.unit}</span>
                              </div>
                            )
                          })}
                          <div style={{ fontSize:10, color:'var(--orange)', marginTop:1 }}>{mCal} kcal</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Ações */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {!isToday && (
                      <button className="btn btn-ghost" style={{ padding:'4px 0', fontSize:11, width:'100%', justifyContent:'center' }}
                        onClick={e=>{e.stopPropagation();applyToday(d)}}>
                        Aplicar hoje
                      </button>
                    )}
                    <button className="btn btn-danger" style={{ padding:'4px 0', fontSize:11, width:'100%', justifyContent:'center' }}
                      onClick={e=>{e.stopPropagation();removePlan(d)}}>
                      Remover
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize:12, color:'var(--text3)' }}>Sem plano</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
