import { Users, TrendingUp, Award, FileText, Heart } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'

function fmt(n) {
  if (n == null || n === 0) return '—'
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
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
  const interacoes = posts.reduce((s,p) =>
    s + (p.curtidas||0) + (p.comentarios||0) + (p.reposts||0) + (p.compartilhamentos||0) + (p.salvamentos||0), 0)

  const cards = [
    {
      label: mobile ? 'Alcançado' : 'Total alcançado',
      value: fmt(total),
      sub: 'contas alcançadas',
      accent: '#FF6200', iconBg: 'rgba(255,98,0,0.10)', icon: Users, highlight: true,
    },
    {
      label: mobile ? 'Média/post' : 'Média por post',
      value: fmt(media),
      sub: 'contas por publicação',
      accent: '#C3EBF7', iconBg: 'rgba(195,235,247,0.3)', icon: TrendingUp, highlight: false,
    },
    {
      label: mobile ? 'Melhor' : 'Melhor post',
      value: fmt(melhor?.contas_alcancadas),
      sub: (melhor?.nome||melhor?.tema||'—').slice(0, mobile ? 16 : 24),
      accent: '#1C252E', iconBg: 'rgba(195,235,247,0.3)', icon: Award, highlight: false,
    },
    {
      label: 'Posts',
      value: String(posts.length),
      sub: `${posts.filter(p=>p.status==='parcial').length} parciais`,
      accent: '#1C252E', iconBg: 'rgba(28,37,46,0.08)', icon: FileText, highlight: false,
    },
    {
      label: 'Interações',
      value: fmt(interacoes),
      sub: 'soma do mês',
      accent: '#FF6200', iconBg: 'rgba(255,98,0,0.10)', icon: Heart, highlight: false,
    },
  ]

  return (
    <>
    {/* CSS injetado — garante 2 colunas no mobile independente de qualquer cache */}
    <style>{`
      @media (max-width: 768px) {
        .kpi-grid-js { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
        .kpi-card-js { padding: 10px !important; }
        .kpi-label-js { font-size: 8px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin-bottom: 5px !important; }
        .kpi-number-js { font-size: 16px !important; margin-bottom: 2px !important; }
        .kpi-sub-js { font-size: 8px !important; }
        .kpi-icon-js { display: none !important; }
      }
      @media (max-width: 390px) {
        .kpi-number-js { font-size: 14px !important; }
      }
    `}</style>
    <div className="kpi-grid-js" style={{
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)',
      gap: mobile ? 8 : 14,
      marginBottom: 14,
    }}>
      {cards.map(({ label, value, sub, accent, iconBg, icon: Icon, highlight }) => (
        <div key={label} className="card kpi-card kpi-card-js" style={{
          padding: mobile ? '12px 12px' : '18px 20px',
          borderTop: highlight ? `3px solid ${accent}` : '3px solid transparent',
          position: 'relative',
          minWidth: 0,       /* CRÍTICO: impede o card de estouro o grid */
          overflow: 'hidden',
        }}>
          <p className="kpi-label-js" style={{
            color: '#8A9BB0', fontSize: mobile ? 10 : 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: mobile ? 8 : 14,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {label}
          </p>
          <p className="kpi-number-js" style={{
            color: '#182638', fontSize: mobile ? 20 : 28, fontWeight: 800,
            lineHeight: 1, letterSpacing: '-0.02em', marginBottom: mobile ? 4 : 6,
          }}>
            {value}
          </p>
          <p className="kpi-sub-js" style={{
            color: '#A8B5C0', fontSize: mobile ? 10 : 12,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub}
          </p>
        </div>
      ))}
    </div>
    </>
  )
}
