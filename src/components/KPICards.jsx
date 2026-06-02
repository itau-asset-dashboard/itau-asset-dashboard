import { Users, TrendingUp, Award, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'

function fmt(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
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

  const cards = [
    {
      label: mobile ? 'Alcançado' : 'Total alcançado',
      value: fmt(total),
      sub: 'contas alcançadas',
      accent: '#F97316', iconBg: 'rgba(249,115,22,0.10)', icon: Users, highlight: true,
    },
    {
      label: mobile ? 'Média/post' : 'Média por post',
      value: fmt(media),
      sub: 'contas por publicação',
      accent: '#0F7EC0', iconBg: 'rgba(15,126,192,0.10)', icon: TrendingUp, highlight: false,
    },
    {
      label: mobile ? 'Melhor' : 'Melhor post',
      value: fmt(melhor?.contas_alcancadas),
      sub: (melhor?.nome||melhor?.tema||'—').slice(0, mobile ? 16 : 24),
      accent: '#7C3AED', iconBg: 'rgba(124,58,237,0.10)', icon: Award, highlight: false,
    },
    {
      label: 'Posts',
      value: String(posts.length),
      sub: `${posts.filter(p=>p.status==='parcial').length} parciais`,
      accent: '#059669', iconBg: 'rgba(5,150,105,0.10)', icon: FileText, highlight: false,
    },
  ]

  return (
    <>
    {/* CSS injetado — garante 2 colunas no mobile independente de qualquer cache */}
    <style>{`
      @media (max-width: 768px) {
        .kpi-grid-js { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
        .kpi-card-js { padding: 11px 11px !important; }
        .kpi-label-js { font-size: 9px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin-bottom: 7px !important; }
        .kpi-number-js { font-size: 19px !important; margin-bottom: 3px !important; }
        .kpi-sub-js { font-size: 9px !important; }
        .kpi-icon-js { display: none !important; }
      }
    `}</style>
    <div className="kpi-grid-js" style={{
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
      gap: mobile ? 8 : 14,
      marginBottom: 14,
    }}>
      {cards.map(({ label, value, sub, accent, iconBg, icon: Icon, highlight }) => (
        <div key={label} className="card kpi-card kpi-card-js" style={{
          padding: mobile ? '12px 12px' : '18px 20px',
          borderTop: highlight ? `3px solid ${accent}` : '3px solid transparent',
          position: 'relative',
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
          {/* Ícone — só desktop */}
          {!mobile && (
            <div style={{
              position: 'absolute', top: 18, right: 18,
              width: 30, height: 30, borderRadius: 8,
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={14} color={accent} strokeWidth={2.1} />
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  )
}
