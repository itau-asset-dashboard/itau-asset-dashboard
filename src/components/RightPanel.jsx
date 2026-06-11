import { useState } from 'react'
import { Edit2, Check } from 'lucide-react'
import { calcMetaMesProgressiva } from '../utils/metaCalc'
import { useStore } from '../store/useStore'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function mesFiltroLabel(val) {
  if (!val) return val
  const [mm, yyyy] = val.split('/')
  return `${MESES_NOMES[parseInt(mm,10)-1]} ${yyyy}`
}

function fmt(n) {
  if (n==null) return '—'
  if (n>=1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

function EditableValue({ value, color, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  if (editing) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
      <input autoFocus value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){const v=parseInt(input.replace(/\D/g,''));if(!isNaN(v)&&v>0){onSave(v)}setEditing(false)}if(e.key==='Escape')setEditing(false)}}
        style={{ width:80, background:'#fff', border:'1.5px solid #C3EBF7', borderRadius:6, padding:'3px 6px', color:'#1C252E', fontSize:13, outline:'none', textAlign:'center' }}/>
      <button onClick={()=>{const v=parseInt(input.replace(/\D/g,''));if(!isNaN(v)&&v>0)onSave(v);setEditing(false)}}
        style={{ background:'#C3EBF7', border:'none', borderRadius:6, width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Check size={11} color="#0E7490"/>
      </button>
    </div>
  )
  return (
    <button onClick={()=>{setInput(String(value));setEditing(true)}}
      style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      <p style={{ color, fontSize:17, fontWeight:800, lineHeight:1 }}>{fmt(value)}</p>
      <p style={{ color:'#8A9BB0', fontSize:10, display:'flex', alignItems:'center', gap:2 }}>
        meta <Edit2 size={8} color="#8A9BB0"/>
      </p>
    </button>
  )
}

export default function RightPanel() {
  const { setMetaMensal, metaAnual, getPostsDoMes, posts: allPosts, mesFiltro } = useStore()
  const postsMes = getPostsDoMes()
  const totalMensal = postsMes.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const [mmFiltro, yyyyFiltro] = (mesFiltro || '').split('/')
  const metaAjustada = calcMetaMesProgressiva({ posts: allPosts, metaAnual, mm: mmFiltro, yyyy: yyyyFiltro })
  const pctMensal = metaAjustada>0 ? Math.min((totalMensal/metaAjustada)*100,100) : 0
  const metaMesOriginal = Math.round(metaAnual/12)

  return (
    <aside className="right-panel-desktop" style={{
      width: 272,
      height: '100%',
      background: '#FFFFFF',
      borderLeft: '1px solid #E8ECF0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      flexShrink: 0,
    }}>
      <div style={{ background:'#F5F8FA', borderRadius:16, padding:'20px', border:'1px solid #E8ECF0', width:'100%' }}>
        <p style={{ color:'#8A9BB0', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          {mesFiltroLabel(mesFiltro)}
        </p>

        {/* Percentual em destaque */}
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <p style={{ color: pctMensal>=100 ? '#16a34a' : '#F97316', fontSize:36, fontWeight:800, lineHeight:1 }}>
            {pctMensal.toFixed(0)}%
          </p>
          <p style={{ color:'#8A9BB0', fontSize:11, marginTop:4 }}>da meta do mês</p>
        </div>

        {/* Barra */}
        <div style={{ background:'#E8ECF0', borderRadius:4, height:6, overflow:'hidden', marginBottom:16 }}>
          <div style={{
            height:'100%', borderRadius:4,
            background: pctMensal>=100 ? '#16a34a' : '#F97316',
            width:`${Math.min(pctMensal,100)}%`,
            transition:'width 0.6s ease',
          }}/>
        </div>

        {/* Alcançado × Meta */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:'#F97316', fontSize:20, fontWeight:800, lineHeight:1 }}>{fmt(totalMensal)}</p>
            <p style={{ color:'#8A9BB0', fontSize:10, marginTop:3 }}>alcançadas</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <EditableValue value={metaAjustada} color="#0891B2" onSave={setMetaMensal}/>
          </div>
        </div>

        {metaAjustada !== metaMesOriginal && (
          <p style={{ color:'#8A9BB0', fontSize:10, marginTop:12, textAlign:'center', lineHeight:1.4 }}>
            ↻ Meta ajustada (saldo acumulado)
          </p>
        )}
      </div>
    </aside>
  )
}
