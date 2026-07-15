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

  // Anel SVG
  const R = 44, CIRC = 2 * Math.PI * R
  const dash = (pctMensal / 100) * CIRC
  const ringColor = atingiu ? '#16a34a' : '#FF6200'

  return (
    <aside className="right-panel-desktop" style={{
      width: 252,
      height: '100%',
      background: 'linear-gradient(160deg, #ffffff 0%, #F5F8FA 60%, #EEF4F8 100%)',
      borderLeft: '1px solid #E8ECF0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      flexShrink: 0,
      gap: 20,
    }}>

      {/* Label do mês */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#B0BEC5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Meta mensal
        </p>
        <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, marginTop: 3 }}>{mesNome} {yyyyFiltro}</p>
      </div>

      {/* Anel de progresso */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'relative' }}>
          <circle cx="55" cy="55" r={R} fill="none" stroke="#E8ECF0" strokeWidth="9"/>
          <circle cx="55" cy="55" r={R} fill="none"
            stroke={ringColor} strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC - dash}`}
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dasharray 0.7s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: ringColor, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
            {pctReal.toFixed(0)}%
          </span>
          <span style={{ color: '#8A9BB0', fontSize: 10, marginTop: 3 }}>do mês</span>
        </div>
      </div>

      {/* Números */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Alcançado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EAECF0' }}>
          <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Alcançado</span>
          <span style={{ color: '#FF6200', fontSize: 15, fontWeight: 800 }}>{fmt(totalMensal)}</span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EAECF0' }}>
          <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Meta</span>
          <EditableValue value={metaAjustada} color="#1C252E" onSave={setMetaMensal}/>
        </div>

        {/* Falta / Atingiu */}
        {!atingiu && falta > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600 }}>Faltam</span>
            <span style={{ color: '#C05010', fontSize: 14, fontWeight: 700 }}>{fmt(falta)}</span>
          </div>
        )}
        {atingiu && !superou && (
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓ Meta atingida</span>
          </div>
        )}
        {superou && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>↑ Meta superada</span>
            <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 800 }}>+{fmt(excesso)}</span>
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
