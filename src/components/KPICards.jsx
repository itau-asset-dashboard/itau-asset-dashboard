import { Users, TrendingUp, Award, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'

function fmt(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

// laranja só no total (métrica principal); demais usam azul escuro e azul claro
const CARDS = [
  { key:'total',  label:'Total alcançado',    icon:Users,     color:'#FF6200', iconBg:'rgba(255,98,0,0.12)',   valueBg:'rgba(255,98,0,0.06)' },
  { key:'media',  label:'Média por post',      icon:TrendingUp,color:'#1C252E', iconBg:'rgba(28,37,46,0.08)',   valueBg:'rgba(28,37,46,0.03)' },
  { key:'melhor', label:'Melhor post',         icon:Award,     color:'#1a7a96', iconBg:'rgba(195,235,247,0.6)', valueBg:'rgba(195,235,247,0.2)' },
  { key:'count',  label:'Posts cadastrados',   icon:FileText,  color:'#1C252E', iconBg:'rgba(28,37,46,0.08)',   valueBg:'rgba(28,37,46,0.03)' },
]

export default function KPICards() {
  const { getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  const total  = posts.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const media  = posts.length>0 ? Math.round(total/posts.length) : 0
  const melhor = posts.length>0 ? posts.reduce((a,b)=>(a.contas_alcancadas||0)>(b.contas_alcancadas||0)?a:b,posts[0]) : null

  const values = {
    total:  { v: fmt(total),                    sub: 'contas alcançadas' },
    media:  { v: fmt(media),                    sub: 'contas / publicação' },
    melhor: { v: fmt(melhor?.contas_alcancadas), sub: (melhor?.nome||melhor?.tema||'—').slice(0,26) },
    count:  { v: String(posts.length),          sub: `${posts.filter(p=>p.status==='parcial').length} parciais` },
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
      {CARDS.map(({ key, label, icon:Icon, color, iconBg, valueBg }) => {
        const { v, sub } = values[key]
        return (
          <div key={key} className="card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:valueBg, borderRadius:18 }} />
            <div style={{ position:'relative' }}>
              <div style={{ width:34, height:34, borderRadius:9, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Icon size={16} color={color} strokeWidth={2.1} />
              </div>
              <p style={{ color:'#8A9BB0', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>{label}</p>
              <p style={{ color:'#1C252E', fontSize:24, fontWeight:700, lineHeight:1.1, marginBottom:2 }}>{v}</p>
              <p style={{ color:'#8A9BB0', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
