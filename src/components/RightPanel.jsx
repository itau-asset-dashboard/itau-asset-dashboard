import { useState } from 'react'
import { Edit2, Check } from 'lucide-react'
import { calcMetaMesProgressiva } from '../utils/metaCalc'
import { useStore } from '../store/useStore'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (n==null) return '—'
  if (n>=1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

function diasRestantes(mesFiltro) {
  const [mm, yyyy] = (mesFiltro || '').split('/')
  if (!mm || !yyyy) return null
  const hoje = new Date()
  const ultimoDia = new Date(parseInt(yyyy), parseInt(mm), 0)
  const mesAno = new Date(parseInt(yyyy), parseInt(mm) - 1, 1)
  if (hoje < mesAno || hoje > ultimoDia) return null
  return ultimoDia.getDate() - hoje.getDate()
}

function EditableValue({ value, color, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  if (editing) return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <input autoFocus value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){const v=parseInt(input.replace(/\D/g,''));if(!isNaN(v)&&v>0){onSave(v)}setEditing(false)}if(e.key==='Escape')setEditing(false)}}
        style={{ width:80, background:'rgba(255,255,255,0.9)', border:'1.5px solid #C3EBF7', borderRadius:6, padding:'3px 6px', color:'#1C252E', fontSize:13, outline:'none', textAlign:'center' }}/>
      <button onClick={()=>{const v=parseInt(input.replace(/\D/g,''));if(!isNaN(v)&&v>0)onSave(v);setEditing(false)}}
        style={{ background:'#C3EBF7', border:'none', borderRadius:6, width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Check size={11} color="#0E7490"/>
      </button>
    </div>
  )
  return (
    <button onClick={()=>{setInput(String(value));setEditing(true)}}
      style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ color, fontSize:13, fontWeight:700 }}>{fmt(value)}</span>
      <Edit2 size={10} color="#8A9BB0"/>
    </button>
  )
}

export default function RightPanel() {
  const { setMetaMensal, metaAnual, getPostsDoMes, posts: allPosts, mesFiltro } = useStore()
  const postsMes = getPostsDoMes()
  const totalMensal = postsMes.reduce((s,p) => s+(p.contas_alcancadas||0), 0)
  const [mmFiltro, yyyyFiltro] = (mesFiltro || '').split('/')
  const metaAjustada = calcMetaMesProgressiva({ posts: allPosts, metaAnual, mm: mmFiltro, yyyy: yyyyFiltro })
  const pctMensal = metaAjustada > 0 ? Math.min((totalMensal/metaAjustada)*100, 100) : 0
  const metaMesOriginal = Math.round(metaAnual/12)
  const falta = Math.max(metaAjustada - totalMensal, 0)
  const dias = diasRestantes(mesFiltro)
  const mesNome = MESES_NOMES[(parseInt(mmFiltro, 10)||1) - 1]
  const atingiu = pctMensal >= 100

  // Anel SVG
  const R = 54, CIRC = 2 * Math.PI * R
  const dash = (pctMensal / 100) * CIRC
  const ringColor = atingiu ? '#16a34a' : '#F97316'

  return (
    <aside className="right-panel-desktop" style={{
      width: 272,
      height: '100%',
      background: 'linear-gradient(160deg, #ffffff 0%, #F5F8FA 60%, #EEF4F8 100%)',
      borderLeft: '1px solid #E8ECF0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      flexShrink: 0,
      gap: 24,
    }}>

      {/* Label do mês */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Meta mensal
        </p>
        <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, marginTop: 3 }}>{mesNome} {yyyyFiltro}</p>
      </div>

      {/* Anel de progresso */}
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        {/* Glow sutil atrás do anel */}
        <div style={{
          position: 'absolute', inset: 12, borderRadius: '50%',
          background: atingiu ? 'rgba(22,163,74,0.06)' : 'rgba(249,115,22,0.06)',
          filter: 'blur(8px)',
        }} />
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: 'relative' }}>
          {/* Trilha */}
          <circle cx="70" cy="70" r={R} fill="none" stroke="#E8ECF0" strokeWidth="10"/>
          {/* Progresso */}
          <circle cx="70" cy="70" r={R} fill="none"
            stroke={ringColor} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC - dash}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dasharray 0.7s ease, stroke 0.4s ease' }}
          />
        </svg>
        {/* Texto central */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: ringColor, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {pctMensal.toFixed(0)}%
          </span>
          <span style={{ color: '#8A9BB0', fontSize: 10, marginTop: 3 }}>do mês</span>
        </div>
      </div>

      {/* Números */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Alcançado */}
        <div style={{
          background: 'rgba(255,255,255,0.7)', borderRadius: 12,
          border: '1px solid rgba(232,236,240,0.8)',
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Alcançado</span>
          <span style={{ color: '#F97316', fontSize: 15, fontWeight: 800 }}>{fmt(totalMensal)}</span>
        </div>

        {/* Meta */}
        <div style={{
          background: 'rgba(255,255,255,0.7)', borderRadius: 12,
          border: '1px solid rgba(232,236,240,0.8)',
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Meta</span>
          <EditableValue value={metaAjustada} color="#0891B2" onSave={setMetaMensal}/>
        </div>

        {/* Falta / Atingiu */}
        {!atingiu && falta > 0 && (
          <div style={{
            background: 'rgba(249,115,22,0.05)', borderRadius: 12,
            border: '1px solid rgba(249,115,22,0.15)',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Faltam</span>
            <span style={{ color: '#C05010', fontSize: 14, fontWeight: 700 }}>{fmt(falta)}</span>
          </div>
        )}
        {atingiu && (
          <div style={{
            background: 'rgba(22,163,74,0.06)', borderRadius: 12,
            border: '1px solid rgba(22,163,74,0.2)',
            padding: '12px 16px', textAlign: 'center',
          }}>
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓ Meta atingida</span>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div style={{ textAlign: 'center' }}>
        {metaAjustada !== metaMesOriginal && (
          <p style={{ color: '#8A9BB0', fontSize: 10, lineHeight: 1.5 }}>↻ Meta ajustada (saldo acumulado)</p>
        )}
        {dias != null && (
          <p style={{ color: '#B0BEC5', fontSize: 10, marginTop: 4 }}>
            {dias === 0 ? 'Último dia do mês' : `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

    </aside>
  )
}
