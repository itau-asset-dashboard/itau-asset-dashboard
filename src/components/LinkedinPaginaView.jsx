import { useState, useMemo } from 'react'
import { Edit2, Check, X, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FIELDS = [
  { key: 'impressoes',          label: 'Impressões',          color: '#0A66C2' },
  { key: 'usuarios_alcancados', label: 'Usuários alcançados', color: '#FF6200' },
  { key: 'novos_seguidores',    label: 'Novos seguidores',    color: '#16a34a' },
  { key: 'reacoes',             label: 'Reações',             color: '#0A66C2' },
  { key: 'comentarios',         label: 'Comentários',         color: '#1C252E' },
  { key: 'compartilhamentos',   label: 'Compartilhamentos',   color: '#1C252E' },
]

function fmtN(n) {
  if (n == null || n === '' || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function parseInput(v) {
  if (v === '' || v == null) return null
  const clean = String(v).replace(/\./g, '').replace(/\s/g, '').replace(',', '.')
  const n = Number(clean)
  return isNaN(n) ? null : n
}

function delta(curr, prev) {
  if (!curr || !prev) return null
  return ((curr - prev) / prev) * 100
}

function DeltaBadge({ pct }) {
  if (pct == null) return null
  const up = pct >= 0
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:11, fontWeight:700,
      color: up ? '#16a34a' : '#ef4444', marginTop:4 }}>
      {up ? <ArrowUp size={11}/> : <ArrowDown size={11}/>}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function LinkedinPaginaView({ data, seguidores, ano, isEditMode, onSave, onSaveSeguidores }) {
  const mobile = useIsMobile()
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0')
  const [mes, setMes]           = useState(mesAtual)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm]         = useState({})
  const [editSeg, setEditSeg]   = useState(false)
  const [segForm, setSegForm]   = useState('')

  const mesIdx  = parseInt(mes, 10) - 1
  const chave   = `${mes}/${ano}`
  const prevKey = `${String(mesIdx).padStart(2,'0')}/${ano}`
  const mesData  = data[chave]   || {}
  const prevData = data[prevKey] || {}

  // Totais anuais
  const totais = useMemo(() => {
    const keys = Array.from({length:12}, (_,i) => `${String(i+1).padStart(2,'0')}/${ano}`)
    return Object.fromEntries(FIELDS.map(f => [
      f.key,
      keys.reduce((s, k) => s + (Number(data[k]?.[f.key]) || 0), 0)
    ]))
  }, [data, ano])

  // Chart data
  const chartData = useMemo(() => MESES_LABEL.map((label, i) => {
    const mm = String(i+1).padStart(2,'0')
    const d  = data[`${mm}/${ano}`] || {}
    return { label, impressoes: Number(d.impressoes)||0, usuarios_alcancados: Number(d.usuarios_alcancados)||0, novos_seguidores: Number(d.novos_seguidores)||0 }
  }), [data, ano])

  function openEdit() {
    setForm(Object.fromEntries(FIELDS.map(f => [f.key, mesData[f.key] ?? ''])))
    setEditOpen(true)
  }

  async function handleSave() {
    const parsed = Object.fromEntries(FIELDS.map(f => [f.key, parseInput(form[f.key])]))
    await onSave(chave, parsed)
    setEditOpen(false)
  }

  async function handleSaveSeg() {
    await onSaveSeguidores(parseInput(segForm))
    setEditSeg(false)
  }

  const cols = mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)'
  const pad  = mobile ? '12px 14px' : '16px 20px'
  const fs   = mobile ? 20 : 24

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* KPIs anuais — mesma grade da Visão Anual */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mobile ? 8 : 12 }}>

        {/* Seguidores — editável */}
        <div className="card" style={{ padding: pad, position:'relative' }}>
          <p style={{ color:'#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Seguidores</p>
          {editSeg ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <input autoFocus type="text" inputMode="numeric" value={segForm}
                onChange={e => setSegForm(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') handleSaveSeg(); if(e.key==='Escape') setEditSeg(false) }}
                placeholder="Ex: 216.560"
                style={{ border:'1.5px solid #0A66C2', borderRadius:8, padding:'5px 9px', fontSize:14, fontFamily:'DM Sans, sans-serif', outline:'none', width:'100%', boxSizing:'border-box' }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={handleSaveSeg} style={{ flex:1, background:'#1C252E', color:'#C3EBF7', border:'none', borderRadius:7, padding:'6px', cursor:'pointer', display:'flex', justifyContent:'center' }}><Check size={13}/></button>
                <button onClick={() => setEditSeg(false)} style={{ flex:1, background:'#F4F6F8', border:'none', borderRadius:7, padding:'6px', cursor:'pointer', display:'flex', justifyContent:'center' }}><X size={13} color="#8A9BB0"/></button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ color:'#1C252E', fontSize: fs, fontWeight:800, lineHeight:1, marginBottom:4 }}>{fmtN(seguidores)}</p>
              <p style={{ color:'#A8B5C0', fontSize: mobile ? 9 : 11 }}>seguidores atuais</p>
            </>
          )}
          {isEditMode && !editSeg && (
            <button onClick={() => { setSegForm(seguidores ?? ''); setEditSeg(true) }}
              style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', color:'#C0CEDA' }}>
              <Edit2 size={12}/>
            </button>
          )}
        </div>

        {/* Impressões, Usuários alcançados, Novos seguidores */}
        {['impressoes','usuarios_alcancados','novos_seguidores'].map(key => {
          const f = FIELDS.find(f => f.key === key)
          return (
            <div key={key} className="card" style={{ padding: pad }}>
              <p style={{ color:'#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{f.label}</p>
              <p style={{ color:'#1C252E', fontSize: fs, fontWeight:800, lineHeight:1, marginBottom:4 }}>{fmtN(totais[key])}</p>
              <p style={{ color:'#A8B5C0', fontSize: mobile ? 9 : 11 }}>em {ano}</p>
            </div>
          )
        })}
      </div>

      {/* Segunda linha: Reações, Comentários, Compartilhamentos */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: mobile ? 8 : 12 }}>
        {['reacoes','comentarios','compartilhamentos'].map(key => {
          const f = FIELDS.find(f => f.key === key)
          return (
            <div key={key} className="card" style={{ padding: pad }}>
              <p style={{ color:'#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{f.label}</p>
              <p style={{ color:'#1C252E', fontSize: fs, fontWeight:800, lineHeight:1, marginBottom:4 }}>{fmtN(totais[key])}</p>
              <p style={{ color:'#A8B5C0', fontSize: mobile ? 9 : 11 }}>em {ano}</p>
            </div>
          )
        })}
      </div>

      {/* Seletor de mês */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {MESES_LABEL.map((label, i) => {
            const mm = String(i+1).padStart(2,'0')
            const ativo = mes === mm
            return (
              <button key={mm} onClick={() => setMes(mm)} style={{
                padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer',
                fontSize:12, fontWeight: ativo ? 700 : 400,
                background: ativo ? '#1C252E' : '#F0F4F8',
                color: ativo ? '#C3EBF7' : '#6B7A8D',
              }}>{label}</button>
            )
          })}
        </div>
        {isEditMode && (
          <button onClick={openEdit} style={{
            display:'flex', alignItems:'center', gap:6, background:'#F0F4F8',
            border:'1.5px solid #EDEFF2', borderRadius:10, padding:'7px 12px',
            fontSize:13, fontWeight:600, cursor:'pointer', color:'#1C252E', whiteSpace:'nowrap',
          }}>
            <Edit2 size={13}/> Editar {MESES_FULL[mesIdx]}
          </button>
        )}
      </div>

      {/* KPIs mensais com delta */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(160px,1fr))', gap: mobile ? 8 : 12 }}>
        {FIELDS.map(f => {
          const curr = mesData[f.key]
          const prev = prevData[f.key]
          return (
            <div key={f.key} className="card" style={{ padding: pad }}>
              <p style={{ color:'#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{f.label}</p>
              <p style={{ color: f.color, fontSize: mobile ? 20 : 22, fontWeight:800, lineHeight:1 }}>{fmtN(curr)}</p>
              <DeltaBadge pct={delta(curr, prev)}/>
            </div>
          )
        })}
      </div>

      {/* Gráfico evolução anual */}
      <div className="card" style={{ padding: mobile ? 14 : 20 }}>
        <p style={{ color:'#1C252E', fontSize:14, fontWeight:700, marginBottom:4 }}>Evolução anual — {ano}</p>
        <p style={{ color:'#8A9BB0', fontSize:12, marginBottom:16 }}>Impressões, usuários alcançados e novos seguidores por mês</p>
        <ResponsiveContainer width="100%" height={mobile ? 140 : 200}>
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top:8, right:4, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false}/>
            <XAxis dataKey="label" tick={{ fontSize:11, fill:'#9AAAB8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11, fill:'#9AAAB8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v} width={44}/>
            <Tooltip formatter={(v, name) => [fmtN(v), FIELDS.find(f=>f.key===name)?.label || name]} labelStyle={{ color:'#1C252E', fontWeight:700 }} contentStyle={{ borderRadius:10, border:'1px solid #F0F4F8', fontSize:12 }}/>
            <Bar dataKey="impressoes"          fill="#C3EBF7" radius={[4,4,0,0]}/>
            <Bar dataKey="usuarios_alcancados" fill="#FF6200" radius={[4,4,0,0]}/>
            <Bar dataKey="novos_seguidores"    fill="#1C252E" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
          {[['#C3EBF7','Impressões'],['#FF6200','Usuários alcançados'],['#1C252E','Novos seguidores']].map(([color,label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
              <span style={{ fontSize:11, color:'#8A9BB0' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal edição mensal */}
      {editOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, maxHeight:'90vh', overflow:'auto', boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
              <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Dados de {MESES_FULL[mesIdx]} {ano}</h2>
              <button onClick={() => setEditOpen(false)} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
                <X size={16} color="#8A9BB0"/>
              </button>
            </div>
            <div style={{ padding:'16px 20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>{f.label}</p>
                  <input type="text" inputMode="numeric" value={form[f.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="—"
                    style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box' }}/>
                </div>
              ))}
              <button onClick={handleSave} style={{ marginTop:6, background:'#1C252E', color:'#C3EBF7', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Check size={16}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
