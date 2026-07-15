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
  const pctReal   = metaAjustada > 0 ? (totalMensal / metaAjustada) * 100 : 0
  const pctMensal = Math.min(pctReal, 100)   // usado só para o anel (não passa de 100%)
  const metaMesOriginal = Math.round(metaAnual/12)
  const falta    = Math.max(metaAjustada - totalMensal, 0)
  const excesso  = Math.max(totalMensal - metaAjustada, 0)
  const dias     = diasRestantes(mesFiltro)
  const mesNome  = MESES_NOMES[(parseInt(mmFiltro, 10)||1) - 1]
  const atingiu  = pctReal >= 100
  const superou  = pctReal > 100

  const barWidth = Math.min(pctReal, 100)
  const ringColor = atingiu ? '#16a34a' : '#FF6200'

  return (
    <aside className="right-panel-desktop" style={{
      width: 210,
      height: '100%',
      background: 'linear-gradient(160deg, #ffffff 0%, #F5F8FA 60%, #EEF4F8 100%)',
      borderLeft: '1px solid #E8ECF0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      flexShrink: 0,
      gap: 16,
    }}>

      {/* Label do mês */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#B0BEC5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Meta mensal
        </p>
        <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, marginTop: 3 }}>{mesNome} {yyyyFiltro}</p>
      </div>

      {/* % grande */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: ringColor, fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
          {pctReal.toFixed(0)}%
        </p>
        <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 6 }}>da meta atingida</p>
      </div>

      {/* Barra de progresso */}
      <div style={{ alignSelf: 'stretch', background: '#E8ECF0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 6, background: ringColor, width: `${barWidth}%`, transition: 'width 0.6s ease' }}/>
      </div>

      {/* Dois cards lado a lado */}
      <div style={{ alignSelf: 'stretch', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ color: '#B0BEC5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Alcançado</p>
          <p style={{ color: ringColor, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{fmt(totalMensal)}</p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ color: '#B0BEC5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Meta</p>
          <p style={{ color: '#8A9BB0', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{fmt(metaAjustada)}</p>
          {metaAjustada !== metaMesOriginal && <p style={{ color: '#C0CEDA', fontSize: 10, marginTop: 4 }}>↻ ajustada</p>}
        </div>
      </div>

      {/* Rodapé */}
      {dias != null && (
        <p style={{ color: '#B0BEC5', fontSize: 10, textAlign: 'center' }}>
          {dias === 0 ? 'Último dia do mês' : `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
        </p>
      )}

    </aside>
  )
}
