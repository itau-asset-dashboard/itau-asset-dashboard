import { Users, TrendingUp, Award, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'

function fmt(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const CARDS = [
  { key:'total',  label:'Total alcançado',  icon:Users,     accent:'#F97316', iconBg:'rgba(249,115,22,0.10)',  highlight:true  },
  { key:'media',  label:'Média por post',   icon:TrendingUp,accent:'#0F7EC0', iconBg:'rgba(15,126,192,0.10)',  highlight:false },
  { key:'melhor', label:'Melhor post',      icon:Award,     accent:'#7C3AED', iconBg:'rgba(124,58,237,0.10)',  highlight:false },
  { key:'count',  label:'Posts no mês',     icon:FileText,  accent:'#059669', iconBg:'rgba(5,150,105,0.10)',   highlight:false },
]

function KpiCard({ label, value, sub, icon: Icon, accent, iconBg, highlight, mobile }) {
  return (
    <div className="card kpi-card" style={{
      padding: mobile ? '12px 14px' : '18px 20px',
      borderTop: highlight ? `3px solid ${accent}` : '3px solid transparent',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: mobile ? 8 : 14 }}>
        <p style={{
          color:'#8A9BB0', fontSize: mobile ? 10 : 11, fontWeight:600,
          textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.3,
          paddingRight: mobile ? 4 : 8,
        }}>
          {label}
        </p>
        {!mobile && (
          <div style={{ width:30, height:30, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={14} color={accent} strokeWidth={2.1} />
          </div>
        )}
      </div>
      <p style={{ color:'#182638', fontSize: mobile ? 22 : 28, fontWeight:800, lineHeight:1, letterSpacing:'-0.02em', marginBottom: mobile ? 4 : 6 }}>
        {value}
      </p>
      <p style={{ color:'#A8B5C0', fontSize: mobile ? 10 : 12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {sub}
      </p>
    </div>
  )
}

export default function KPICards() {
  const { getPostsDoMes } = useStore()
  const mobile = useIsMobile()
  const posts = getPostsDoMes()

  const total  = posts.reduce((s,p) => s+(p.contas_alcancadas||0), 0)
  const media  = posts.length > 0 ? Math.round(total/posts.length) : 0
  const melhor = posts.length > 0
    ? posts.reduce((a,b) => (a.contas_alcancadas||0)>(b.contas_alcancadas||0)?a:b, posts[0])
    : null

  const values = {
    total:  { v: fmt(total),                     sub: 'contas alcançadas no mês' },
    media:  { v: fmt(media),                     sub: 'contas por publicação' },
    melhor: { v: fmt(melhor?.contas_alcancadas), sub: (melhor?.nome||melhor?.tema||'—').slice(0,22) },
    count:  { v: String(posts.length),           sub: `${posts.filter(p=>p.status==='parcial').length} parciais` },
  }

  return (
    <div className="kpi-grid" style={{ marginBottom: 14 }}>
      {CARDS.map(({ key, label, icon, accent, iconBg, highlight }) => (
        <KpiCard key={key} mobile={mobile} label={label} icon={icon}
          accent={accent} iconBg={iconBg} highlight={highlight}
          {...values[key]} />
      ))}
    </div>
  )
}
