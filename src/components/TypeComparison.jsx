import { useStore } from '../store/useStore'

function fmt(n) {
  if (!n) return '—'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

// Carrossel → laranja, Reels → azul escuro, Foto → azul claro
const CONFIGS = {
  Carrossel:      { bar:'#FF6200',  text:'#FF6200',  badge:'rgba(255,98,0,0.1)',   badgeText:'#cc4f00' },
  Reels:          { bar:'#1C252E',  text:'#1C252E',  badge:'rgba(28,37,46,0.1)',   badgeText:'#1C252E' },
  'Foto estática':{ bar:'#C3EBF7', text:'#1a7a96',  badge:'rgba(195,235,247,0.5)',badgeText:'#1a7a96' },
}

export default function TypeComparison() {
  const { getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  const stats = Object.keys(CONFIGS).map(tipo => {
    const g = posts.filter(p=>p.tipo===tipo)
    const media = g.length>0 ? Math.round(g.reduce((s,p)=>s+(p.contas_alcancadas||0),0)/g.length) : 0
    return { tipo, count:g.length, media, pct: posts.length>0 ? Math.round((g.length/posts.length)*100):0 }
  }).filter(s=>s.count>0)

  if (stats.length===0) return null
  const maxMedia = Math.max(...stats.map(s=>s.media),1)
  const lider    = stats.reduce((a,b)=>a.media>b.media?a:b,stats[0])

  return (
    <div className="card" style={{ padding:'18px 20px', marginBottom:14 }}>
      <h2 style={{ color:'#1C252E', fontSize:14, fontWeight:700, marginBottom:14 }}>Performance por tipo</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {stats.map(({ tipo, count, media, pct }) => {
          const cfg = CONFIGS[tipo]
          const isLider = tipo===lider.tipo
          return (
            <div key={tipo}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:cfg.bar, border: tipo==='Foto estática'?'1px solid #1a7a96':'none' }} />
                  <span style={{ fontSize:13, color:'#1C252E', fontWeight:isLider?600:400 }}>{tipo}</span>
                  {isLider && (
                    <span style={{ fontSize:10, fontWeight:700, color:cfg.badgeText, background:cfg.badge, padding:'2px 7px', borderRadius:20 }}>
                      Líder
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#8A9BB0', fontSize:11 }}>{count} post{count!==1?'s':''} · {pct}%</span>
                  <span style={{ color:cfg.text, fontSize:14, fontWeight:700, minWidth:52, textAlign:'right' }}>{fmt(media)}</span>
                </div>
              </div>
              <div style={{ background:'#F0F4F8', borderRadius:999, height:6, overflow:'hidden' }}>
                <div style={{ width:`${(media/maxMedia)*100}%`, height:'100%', background:cfg.bar, borderRadius:999, opacity:isLider?1:0.55, transition:'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
