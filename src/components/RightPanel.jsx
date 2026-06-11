import { useState } from 'react'
import { Edit2, Check } from 'lucide-react'
import { calcMetaMesProgressiva } from '../utils/metaCalc'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'

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

const TIPO_ICON  = { Carrossel: LayoutPanelLeft, Reels: Film, 'Foto estática': Image }
const TIPO_COLOR = { Carrossel:'#F97316', Reels:'#0891B2', 'Foto estática':'#0E7490' }
const TIPO_BG    = { Carrossel:'rgba(249,115,22,0.08)', Reels:'rgba(8,145,178,0.08)', 'Foto estática':'rgba(14,116,144,0.08)' }

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
  const { metaMensal, setMetaMensal, metaAnual, setMetaAnual, getPostsDoMes, posts: allPosts, addPost, updatePost, deletePost, mesFiltro } = useStore()
  const postsMes = getPostsDoMes()
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)

  // Anual: todos os posts do ano do filtro
  const anoFiltro = mesFiltro?.split('/')?.[1] || new Date().getFullYear().toString()
  const postsAno = allPosts.filter(p => {
    const parts = p.data_post?.split('/')
    return parts?.[2] === anoFiltro
  })

  const totalAnual     = postsAno.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const totalMensal    = postsMes.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  // Meta progressiva do mês filtrado: (metaAnual − total dos meses anteriores) ÷ meses restantes
  const [mmFiltro, yyyyFiltro] = (mesFiltro || '').split('/')
  const metaAjustada = calcMetaMesProgressiva({ posts: allPosts, metaAnual, mm: mmFiltro, yyyy: yyyyFiltro })
  const pctAnual       = metaAnual>0 ? Math.min((totalAnual/metaAnual)*100,100) : 0
  const pctMensal      = metaAjustada>0 ? Math.min((totalMensal/metaAjustada)*100,100) : 0
  const metaMesOriginal = Math.round(metaAnual/12)

  const recentes = [...allPosts]
    .sort((a,b)=>{
      const p=(s)=>{const[d,m,y]=(s||'').split('/');return new Date(`${y}-${m}-${d}`)}
      return p(b.data_post)-p(a.data_post)
    }).slice(0,5)

  // SVG anel anual
  const R=50, CIRC=2*Math.PI*R
  const dash=(pctAnual/100)*CIRC

  return (
    <aside className="right-panel-desktop" style={{
      width: 272,
      height: '100%',
      background: '#FFFFFF',
      borderLeft: '1px solid #E8ECF0',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 14px',
      gap: 12,
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* Card meta anual — principal */}
      <div style={{ background:'#F5F8FA', borderRadius:16, padding:'14px', border:'1px solid #E8ECF0' }}>
        <p style={{ color:'#8A9BB0', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
          Meta anual {anoFiltro}
        </p>

        {/* Anel */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <div style={{ position:'relative', width:110, height:110 }}>
            <svg width="110" height="110" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#E8ECF0" strokeWidth="9"/>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(195,235,247,0.5)" strokeWidth="9"
                strokeDasharray={`${CIRC} 0`} transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r={R} fill="none" stroke="#F97316" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC-dash}`}
                transform="rotate(-90 60 60)"
                style={{ transition:'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#1C252E', fontSize:22, fontWeight:800, lineHeight:1 }}>{pctAnual.toFixed(0)}%</span>
              <span style={{ color:'#8A9BB0', fontSize:10, marginTop:1 }}>do ano</span>
            </div>
          </div>
        </div>

        {/* Alcançado × Meta anual */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1px 1fr', alignItems:'center', marginBottom:8 }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ color:'#F97316', fontSize:16, fontWeight:800, lineHeight:1 }}>{fmt(totalAnual)}</p>
            <p style={{ color:'#8A9BB0', fontSize:10, marginTop:2 }}>alcançadas</p>
          </div>
          <div style={{ background:'#E8ECF0', height:28, width:1, margin:'0 auto' }}/>
          <div style={{ textAlign:'center' }}>
            <EditableValue value={metaAnual} color="#0891B2" onSave={setMetaAnual}/>
          </div>
        </div>

        {/* Barra progresso mensal ajustada */}
        <div style={{ background:'#fff', borderRadius:10, padding:'10px 12px', border:'1px solid #E8ECF0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <p style={{ color:'#8A9BB0', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {mesFiltroLabel(mesFiltro)}
            </p>
            <p style={{ color:'#1C252E', fontSize:11, fontWeight:700 }}>{pctMensal.toFixed(0)}%</p>
          </div>
          <div style={{ background:'#E8ECF0', borderRadius:4, height:6, overflow:'hidden', marginBottom:6 }}>
            <div style={{
              height:'100%', borderRadius:4,
              background: pctMensal>=100 ? '#16a34a' : '#F97316',
              width:`${Math.min(pctMensal,100)}%`,
              transition:'width 0.6s ease',
            }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#F97316', fontSize:12, fontWeight:700 }}>{fmt(totalMensal)}</span>
            <span style={{ color:'#1C252E', fontSize:12, fontWeight:700 }}>{fmt(metaAjustada)}</span>
          </div>
          {metaAjustada !== metaMesOriginal && (
            <p style={{ color:'#8A9BB0', fontSize:10, marginTop:5, textAlign:'center', lineHeight:1.4 }}>
              ↻ Meta ajustada (saldo acumulado)
            </p>
          )}
        </div>
      </div>

      {/* Posts recentes */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        <p style={{ color:'#8A9BB0', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
          Posts recentes
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:6, overflowY:'auto', flex:1 }} className="scrollbar-thin">
          {recentes.length===0 && (
            <p style={{ color:'#8A9BB0', fontSize:12, textAlign:'center', marginTop:16 }}>Nenhum post ainda</p>
          )}
          {recentes.map(p=>{
            const color = TIPO_COLOR[p.tipo] || '#0891B2'
            return (
              <div key={p.id} onClick={()=>setEditTarget(p)} style={{
                background:'transparent', border:'1px solid #EDEFF2',
                borderRadius:10, padding:'8px 10px',
                display:'flex', alignItems:'center', gap:9, flexShrink:0,
                cursor:'pointer', transition:'background 0.1s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                {/* Dot colorido do tipo */}
                <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#182638', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.nome||p.tema||p.descricao||'—'}
                  </p>
                  <p style={{ color:'#A8B5C0', fontSize:10, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                    {p.data_post}
                    {p.status==='parcial' && <span style={{ color:'#d97706', fontSize:9, fontWeight:600 }}>parcial</span>}
                  </p>
                </div>
                <span style={{ color, fontSize:12, fontWeight:700, flexShrink:0 }}>{fmt(p.contas_alcancadas)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {uploadOpen && (
        <UploadModal mode="new" onClose={()=>setUploadOpen(false)}
          onSave={dados=>addPost(dados)}/>
      )}

      {editTarget && (
        <UploadModal mode="update" post={editTarget}
          onClose={()=>setEditTarget(null)}
          onSave={dados=>{updatePost(editTarget.id,dados);setEditTarget(null)}}
          onDelete={()=>{deletePost(editTarget.id);setEditTarget(null)}}/>
      )}
    </aside>
  )
}
