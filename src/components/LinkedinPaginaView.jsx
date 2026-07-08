import { useState, useMemo } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FIELDS = [
  { key: 'impressoes',          label: 'Impressões',        color: '#0A66C2' },
  { key: 'usuarios_alcancados', label: 'Usuários alcançados', color: '#FF6200' },
  { key: 'novos_seguidores',    label: 'Novos seguidores',  color: '#16a34a' },
  { key: 'seguidores',          label: 'Seguidores (total)', color: '#1C252E' },
  { key: 'reacoes',             label: 'Reações',           color: '#C3EBF7' },
  { key: 'comentarios',         label: 'Comentários',       color: '#8A9BB0' },
  { key: 'compartilhamentos',   label: 'Compartilhamentos', color: '#8A9BB0' },
]

function fmtN(n) {
  if (n == null || n === '' || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

const EMPTY_MES = { impressoes:'', usuarios_alcancados:'', novos_seguidores:'', seguidores:'', reacoes:'', comentarios:'', compartilhamentos:'' }

export default function LinkedinPaginaView({ data, ano, isEditMode, onSave }) {
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0')
  const [mes, setMes] = useState(mesAtual)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm]         = useState({})

  const chave = `${mes}/${ano}`
  const mesData = data[chave] || {}

  // Dados do ano para o gráfico
  const chartData = useMemo(() => {
    return MESES_LABEL.map((label, i) => {
      const mm = String(i + 1).padStart(2, '0')
      const d = data[`${mm}/${ano}`] || {}
      return {
        label,
        impressoes:          Number(d.impressoes)          || 0,
        usuarios_alcancados: Number(d.usuarios_alcancados) || 0,
        novos_seguidores:    Number(d.novos_seguidores)    || 0,
      }
    })
  }, [data, ano])

  function openEdit() {
    setForm(Object.fromEntries(FIELDS.map(f => [f.key, mesData[f.key] ?? ''])))
    setEditOpen(true)
  }

  async function handleSave() {
    const parsed = Object.fromEntries(
      FIELDS.map(f => [f.key, form[f.key] !== '' ? Number(form[f.key]) : null])
    )
    await onSave(chave, parsed)
    setEditOpen(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Seletor de mês */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {MESES_LABEL.map((label, i) => {
            const mm = String(i + 1).padStart(2, '0')
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
            display:'flex', alignItems:'center', gap:6,
            background:'#F0F4F8', border:'1.5px solid #EDEFF2', borderRadius:10,
            padding:'7px 12px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#1C252E',
          }}>
            <Edit2 size={13}/> Editar {MESES_FULL[parseInt(mes,10)-1]}
          </button>
        )}
      </div>

      {/* KPIs do mês */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12 }}>
        {FIELDS.map(f => (
          <div key={f.key} className="card" style={{ padding:'16px 18px' }}>
            <p style={{ color:'#8A9BB0', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>{f.label}</p>
            <p style={{ color: f.color === '#C3EBF7' ? '#0A66C2' : f.color, fontSize:22, fontWeight:800 }}>
              {fmtN(mesData[f.key])}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico anual */}
      <div className="card" style={{ padding:'20px' }}>
        <h3 style={{ color:'#1C252E', fontSize:14, fontWeight:700, marginBottom:4 }}>Evolução anual — {ano}</h3>
        <p style={{ color:'#8A9BB0', fontSize:12, marginBottom:16 }}>Impressões, usuários alcançados e novos seguidores por mês</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false}/>
            <XAxis dataKey="label" tick={{ fontSize:11, fill:'#9AAAB8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11, fill:'#9AAAB8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v}/>
            <Tooltip formatter={(v, name) => [fmtN(v), FIELDS.find(f=>f.key===name)?.label || name]} labelStyle={{ color:'#1C252E', fontWeight:700 }} contentStyle={{ borderRadius:10, border:'1px solid #F0F4F8', fontSize:12 }}/>
            <Bar dataKey="impressoes"          fill="#0A66C2" radius={[4,4,0,0]}/>
            <Bar dataKey="usuarios_alcancados" fill="#FF6200" radius={[4,4,0,0]}/>
            <Bar dataKey="novos_seguidores"    fill="#16a34a" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        {/* Legenda */}
        <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
          {[['#0A66C2','Impressões'],['#FF6200','Usuários alcançados'],['#16a34a','Novos seguidores']].map(([color,label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
              <span style={{ fontSize:11, color:'#8A9BB0' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edição */}
      {editOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
              <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Dados de {MESES_FULL[parseInt(mes,10)-1]} {ano}</h2>
              <button onClick={() => setEditOpen(false)} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
                <X size={16} color="#8A9BB0"/>
              </button>
            </div>
            <div style={{ padding:'16px 20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>{f.label}</p>
                  <input
                    type="number"
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="—"
                    style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box' }}
                  />
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
