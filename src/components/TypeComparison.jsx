import { useStore } from '../store/useStore'

function fmt(n) {
  if (!n) return '—'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

// Carrossel → laranja, Reels → azul escuro, Foto → azul claro
const CONFIGS = {
  Carrossel:      { bar:'#FF6200',  text:'#FF6200',  badge:'rgba(255,128,64,0.1)', badgeText:'#cc5500' },
  Reels:          { bar:'#8A9BB0',  text:'#8A9BB0',  badge:'rgba(138,155,176,0.1)',badgeText:'#5a6b80' },
  'Foto estática':{ bar:'#C3EBF7', text:'#1C252E',  badge:'rgba(195,235,247,0.5)',badgeText:'#1C252E' },
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
      <div style={{ display:'flex', flexDirection:'column' }}>
        {stats.map(({ tipo, count, media, pct }, i) => {
          const cfg = CONFIGS[tipo]
          const isFirst = i === 0
          return (
            <div key={tipo} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < stats.length-1 ? '1px solid #F0F2F5' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background:cfg.bar, border: tipo==='Foto estática'?'1px solid #1C252E':'none' }} />
                <span style={{ fontSize: isFirst?14:13, color:'#1C252E', fontWeight:500 }}>{tipo}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'#8A9BB0', fontSize:11 }}>{count} post{count!==1?'s':''} · {pct}%</span>
                <span style={{ color: isFirst?'#FF6200':cfg.text, fontSize: isFirst?15:13, fontWeight:500, minWidth:52, textAlign:'right' }}>{fmt(media)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
