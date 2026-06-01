import { useState } from 'react'
import { Edit2, Check, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'

function fmt(n) {
  if (n==null) return '—'
  if (n>=1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const TIPO_ICON = { Carrossel:'🎠', Reels:'🎬', 'Foto estática':'📷' }
const TIPO_COLOR = { Carrossel:'#FF6200', Reels:'#C3EBF7', 'Foto estática':'#7ecde8' }

export default function RightPanel() {
  const { metaMensal, setMetaMensal, getPostsDoMes, addPost, mesFiltro } = useStore()
  const posts = getPostsDoMes()
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaInput, setMetaInput]     = useState('')
  const [uploadOpen, setUploadOpen]   = useState(false)

  const total    = posts.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const pct      = metaMensal>0 ? Math.min((total/metaMensal)*100,100) : 0
  const restante = Math.max(metaMensal-total,0)
  const finais   = posts.filter(p=>p.status==='final').length
  const parciais = posts.filter(p=>p.status==='parcial').length

  const projPct  = posts.length>0 ? ((total/posts.length)*30/metaMensal)*100 : 0
  const proj     = projPct>=90
    ? { label:'No caminho', color:'#4ade80', bg:'rgba(74,222,128,0.15)' }
    : projPct>=70
    ? { label:'Em risco',   color:'#fbbf24', bg:'rgba(251,191,36,0.15)' }
    : { label:'Abaixo',     color:'#f87171', bg:'rgba(248,113,113,0.15)' }

  const recentes = [...posts]
    .sort((a,b)=>{
      const p=(s)=>{const[d,m,y]=(s||'').split('/');return new Date(`${y}-${m}-${d}`)}
      return p(b.data_post)-p(a.data_post)
    }).slice(0,5)

  // SVG ring
  const R=50, CIRC=2*Math.PI*R
  const dash=(pct/100)*CIRC

  function saveMeta(){
    const v=parseInt(metaInput.replace(/\D/g,''))
    if(!isNaN(v)&&v>0) setMetaMensal(v)
    setEditingMeta(false)
  }

  return (
    <aside style={{
      width: 272,
      height: '100%',
      background: '#1C252E',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 14px',
      gap: 12,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Cabeçalho */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ color:'#4A5568', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Meta mensal</p>
          <p style={{ color:'#fff', fontSize:14, fontWeight:700, marginTop:1 }}>{mesFiltro}</p>
        </div>
        <span style={{ background:proj.bg, color:proj.color, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
          {proj.label}
        </span>
      </div>

      {/* Card progresso */}
      <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:16, padding:'16px 14px', border:'1px solid rgba(255,255,255,0.07)' }}>
        {/* Anel SVG */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ position:'relative', width:120, height:120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
              {/* trilho azul claro suave */}
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(195,235,247,0.15)" strokeWidth="9"
                strokeDasharray={`${CIRC} 0`} transform="rotate(-90 60 60)"/>
              {/* progresso laranja */}
              <circle cx="60" cy="60" r={R} fill="none" stroke="#FF6200" strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC-dash}`}
                transform="rotate(-90 60 60)"
                style={{ transition:'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontSize:24, fontWeight:800, lineHeight:1 }}>{pct.toFixed(0)}%</span>
              <span style={{ color:'#4A5568', fontSize:10, marginTop:1 }}>atingido</span>
            </div>
          </div>
        </div>

        {/* Alcançado × Meta */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1px 1fr', gap:0, alignItems:'center', marginBottom:10 }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ color:'#FF6200', fontSize:17, fontWeight:800, lineHeight:1 }}>{fmt(total)}</p>
            <p style={{ color:'#4A5568', fontSize:10, marginTop:2 }}>alcançadas</p>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', height:32, width:1, margin:'0 auto' }}/>
          <div style={{ textAlign:'center' }}>
            {editingMeta ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                <input autoFocus value={metaInput} onChange={e=>setMetaInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&saveMeta()}
                  style={{ width:68, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(195,235,247,0.4)', borderRadius:6, padding:'3px 6px', color:'#fff', fontSize:12, outline:'none' }}/>
                <button onClick={saveMeta} style={{ background:'rgba(195,235,247,0.2)', border:'none', borderRadius:6, width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={11} color="#C3EBF7"/>
                </button>
              </div>
            ) : (
              <button onClick={()=>{setEditingMeta(true);setMetaInput(String(metaMensal))}}
                style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <p style={{ color:'#C3EBF7', fontSize:17, fontWeight:800, lineHeight:1 }}>{fmt(metaMensal)}</p>
                <p style={{ color:'#4A5568', fontSize:10, display:'flex', alignItems:'center', gap:2 }}>
                  meta <Edit2 size={8} color="#4A5568"/>
                </p>
              </button>
            )}
          </div>
        </div>

        <p style={{ color:'#4A5568', fontSize:11, textAlign:'center' }}>
          <span style={{ color:'#C3EBF7' }}>{finais}</span> finais ·{' '}
          <span style={{ color:'#fbbf24' }}>{parciais}</span> parciais
          {restante>0 && <> · faltam <span style={{ color:'#FF6200' }}>{fmt(restante)}</span></>}
        </p>
      </div>

      {/* Botão novo post — azul escuro com texto azul claro */}
      <button onClick={()=>setUploadOpen(true)}
        style={{
          width:'100%', background:'rgba(195,235,247,0.15)',
          border:'1.5px solid rgba(195,235,247,0.35)',
          borderRadius:12, padding:'10px',
          color:'#C3EBF7', fontSize:13, fontWeight:700, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          transition:'background 0.15s',
        }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(195,235,247,0.22)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(195,235,247,0.15)'}
      >
        <Plus size={15}/> Novo post
      </button>

      {/* Posts recentes */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        <p style={{ color:'#4A5568', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
          Posts recentes
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:6, overflowY:'auto', flex:1 }} className="scrollbar-thin">
          {recentes.length===0 && (
            <p style={{ color:'#4A5568', fontSize:12, textAlign:'center', marginTop:16 }}>Nenhum post ainda</p>
          )}
          {recentes.map(p=>{
            const color = TIPO_COLOR[p.tipo]||'#C3EBF7'
            return (
              <div key={p.id} style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:12, padding:'9px 11px',
                display:'flex', alignItems:'center', gap:9, flexShrink:0,
              }}>
                <div style={{ width:34, height:34, borderRadius:9, background:'rgba(195,235,247,0.08)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
                  {TIPO_ICON[p.tipo]||'📄'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#E2E8F0', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.nome||p.tema||p.descricao||'—'}
                  </p>
                  <p style={{ color:'#4A5568', fontSize:10, marginTop:2 }}>
                    {p.data_post}{p.status==='parcial'&&<span style={{ color:'#fbbf24', marginLeft:4 }}>🕐</span>}
                  </p>
                </div>
                <span style={{ color, fontSize:13, fontWeight:700, flexShrink:0 }}>{fmt(p.contas_alcancadas)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {uploadOpen && (
        <UploadModal mode="new" onClose={()=>setUploadOpen(false)}
          onSave={dados=>{addPost(dados);setUploadOpen(false)}}/>
      )}
    </aside>
  )
}
