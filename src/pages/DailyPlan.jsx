import { useState, useEffect, useCallback } from 'react'
import { dailyLogsService } from '../services/dailyLogs'
import { foodItemsService  } from '../services/foodItems'
import { goalsService      } from '../services/goals'
import AddToDayModal from '../components/AddToDayModal'
import Toast from '../components/Toast'

const MEALS   = ['Café da manhã','Almoço','Lanche','Jantar','Pré-treino','Pós-treino']
const todayStr = () => new Date().toISOString().split('T')[0]
const fmtDate  = (d) => new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})

function Bar({ label, cur, max, color, unit }) {
  const pct  = Math.min((cur / max) * 100, 100)
  const over = cur > max
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</span>
        <div>
          <span className="mono" style={{ fontSize:16, fontWeight:700, color: over ? 'var(--red)' : color }}>{cur}</span>
          <span style={{ fontSize:11, color:'var(--text3)', marginLeft:4 }}>/ {max} {unit}</span>
        </div>
      </div>
      <div className="track"><div className="fill" style={{ width:`${pct}%`, background: over ? 'var(--red)' : color }} /></div>
      <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{over ? `${cur-max}${unit} acima` : `Faltam ${max-cur}${unit}`}</div>
    </div>
  )
}

export default function DailyPlan() {
  const [date,       setDate]       = useState(todayStr())
  const [logs,       setLogs]       = useState([])
  const [items,      setItems]      = useState([])
  const [goals,      setGoals]      = useState({ calories_goal:2500, protein_goal:150 })
  const [loading,    setLoading]    = useState(true)
  const [showGoals,  setShowGoals]  = useState(false)
  const [goalDraft,  setGoalDraft]  = useState({})
  const [addTarget,  setAddTarget]  = useState(null)
  const [toast,      setToast]      = useState(null)

  const notify = (msg, type='success') => setToast({ msg, type })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [l, g, it] = await Promise.all([
        dailyLogsService.getByDate(date),
        goalsService.get(),
        foodItemsService.getAll(),
      ])
      setLogs(l); setGoals(g); setItems(it)
    } catch (e) { notify('Erro ao carregar: '+e.message, 'error') }
    finally { setLoading(false) }
  }, [date])

  useEffect(() => { load() }, [load])

  const summary = logs.reduce((acc, l) => ({
    calories: acc.calories + (l.snap_calories || 0),
    protein:  +(acc.protein  + (l.snap_protein  || 0)).toFixed(1),
    carbs:    +(acc.carbs    + (l.snap_carbs    || 0)).toFixed(1),
    fat:      +(acc.fat      + (l.snap_fat      || 0)).toFixed(1),
  }), { calories:0, protein:0, carbs:0, fat:0 })

  const handleConfirmAdd = async (entry) => {
    try {
      await dailyLogsService.add({ item_id: addTarget.id, log_date: date, ...entry })
      notify('Refeição registrada')
      setAddTarget(null); await load()
    } catch (e) { notify('Erro: '+e.message, 'error') }
  }

  const handleRemoveLog = async (id) => {
    try {
      await dailyLogsService.remove(id)
      setLogs((p) => p.filter((l) => l.id !== id))
      notify('Removido','error')
    } catch (e) { notify('Erro: '+e.message,'error') }
  }

  const handleSaveGoals = async () => {
    try {
      const g = await goalsService.save({ calories_goal:+goalDraft.calories_goal||2500, protein_goal:+goalDraft.protein_goal||150 })
      setGoals(g); setShowGoals(false); notify('Metas salvas no Supabase')
    } catch (e) { notify('Erro: '+e.message,'error') }
  }

  const byMeal = MEALS.reduce((acc, m) => { acc[m] = logs.filter((l) => l.meal === m); return acc }, {})

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
      {toast     && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {addTarget && <AddToDayModal item={addTarget} onConfirm={handleConfirmAdd} onClose={() => setAddTarget(null)} />}

      {showGoals && (
        <div className="overlay">
          <div className="card slide-up" style={{ width:'100%', maxWidth:360, padding:26 }}>
            <div style={{ fontWeight:600, fontSize:15, marginBottom:20 }}>Metas diárias</div>
            {[{l:'Calorias (kcal)',k:'calories_goal'},{l:'Proteína (g)',k:'protein_goal'}].map((g) => (
              <div key={g.k} style={{ marginBottom:13 }}>
                <label className="lbl">{g.l}</label>
                <input className="field" type="number" value={goalDraft[g.k]||''} onChange={(e)=>setGoalDraft(p=>({...p,[g.k]:e.target.value}))} />
              </div>
            ))}
            <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-ghost" onClick={()=>setShowGoals(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSaveGoals}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-.5px', color:'var(--text)' }}>Plano do Dia</h1>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:4, textTransform:'capitalize' }}>{fmtDate(date)}</p>
        </div>
        <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
          <input type="date" className="field" value={date} onChange={(e)=>setDate(e.target.value)} style={{ width:'auto' }} />
          <button className="btn btn-ghost" onClick={()=>{ setGoalDraft(goals); setShowGoals(true) }}>Metas</button>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding:'22px 26px', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
          <span style={{ fontWeight:600, fontSize:14 }}>Resumo nutricional</span>
          <span style={{ fontSize:12, color:'var(--text3)' }}>{logs.length} registro{logs.length!==1?'s':''}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:22 }}>
          {[
            { l:'Calorias',     v:summary.calories, u:'kcal', c:'var(--orange)' },
            { l:'Proteína',     v:summary.protein,  u:'g',    c:'var(--pink)'   },
            { l:'Carboidratos', v:summary.carbs,    u:'g',    c:'var(--yellow)' },
            { l:'Gorduras',     v:summary.fat,      u:'g',    c:'var(--blue)'   },
          ].map((s) => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <div className="mono" style={{ fontSize:26, fontWeight:700, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:3, textTransform:'uppercase', letterSpacing:'.4px' }}>{s.u}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <Bar label="Calorias" cur={summary.calories} max={goals.calories_goal} color="var(--orange)" unit="kcal" />
          <Bar label="Proteína" cur={summary.protein}  max={goals.protein_goal}  color="var(--pink)"   unit="g"    />
        </div>
      </div>

      {/* Quick add */}
      {items.length > 0 && (
        <div className="card" style={{ padding:'16px 20px', marginBottom:22 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:'var(--text)' }}>Adicionar produto</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {items.slice(0,8).map((item) => (
              <button key={item.id} onClick={()=>setAddTarget(item)}
                style={{ padding:'5px 13px', borderRadius:99, fontSize:12, fontWeight:500, cursor:'pointer',
                  border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text2)',
                  transition:'all .15s' }}
                onMouseOver={(e)=>{ e.target.style.borderColor='rgba(0,200,150,.4)'; e.target.style.color='var(--text)' }}
                onMouseOut={(e) =>{ e.target.style.borderColor='var(--border)';       e.target.style.color='var(--text2)' }}
              >{item.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div className="spin" style={{ width:24, height:24, border:'2px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%', margin:'0 auto' }} />
        </div>
      ) : (
        <>
          {MEALS.map((meal) => {
            const ml = byMeal[meal]; if(!ml.length) return null
            const mCal  = ml.reduce((s,l)=>s+(l.snap_calories||0),0)
            const mProt = ml.reduce((s,l)=>s+(l.snap_protein||0),0).toFixed(1)
            return (
              <div key={meal} className="card" style={{ marginBottom:10, overflow:'hidden' }}>
                <div style={{ padding:'11px 18px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{meal}</span>
                  <div style={{ display:'flex', gap:12 }}>
                    <span className="mono" style={{ fontSize:12, color:'var(--orange)' }}>{mCal} kcal</span>
                    <span className="mono" style={{ fontSize:12, color:'var(--pink)'   }}>{mProt}g</span>
                  </div>
                </div>
                {ml.map((log) => (
                  <div key={log.id} style={{ padding:'11px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:7, background:'var(--surface2)', overflow:'hidden', flexShrink:0 }}>
                        {log.food_items?.photo_url && <img src={log.food_items.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{log.food_items?.name || 'Produto'}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{log.quantity}{log.food_items?.unit}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <span className="mono" style={{ fontSize:13, color:'var(--orange)' }}>{log.snap_calories} kcal</span>
                      <span className="mono" style={{ fontSize:13, color:'var(--pink)'   }}>{log.snap_protein}g</span>
                      <button onClick={()=>handleRemoveLog(log.id)}
                        style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:17, lineHeight:1, padding:'3px 5px', borderRadius:4, transition:'color .15s' }}
                        onMouseOver={(e)=>e.target.style.color='var(--red)'}
                        onMouseOut={(e) =>e.target.style.color='var(--text3)'}
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
          {logs.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:14 }}>Nenhuma refeição registrada</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
