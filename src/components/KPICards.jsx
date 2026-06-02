import { Users, TrendingUp, Award, FileText } from 'lucide-react'
import { useStore } from '../store/useStore'

function fmt(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const CARDS = [
  {
    key: 'total',
    label: 'Total alcançado',
    icon: Users,
    accent: '#FF6B00',
    iconBg: 'rgba(255,107,0,0.10)',
    highlight: true,
  },
  {
    key: 'media',
    label: 'Média por post',
    icon: TrendingUp,
    accent: '#0F7EC0',
    iconBg: 'rgba(15,126,192,0.10)',
    highlight: false,
  },
  {
    key: 'melhor',
    label: 'Melhor post',
    icon: Award,
    accent: '#7C3AED',
    iconBg: 'rgba(124,58,237,0.10)',
    highlight: false,
  },
  {
    key: 'count',
    label: 'Posts cadastrados',
    icon: FileText,
    accent: '#059669',
    iconBg: 'rgba(5,150,105,0.10)',
    highlight: false,
  },
]

export default function KPICards() {
  const { getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  const total  = posts.reduce((s, p) => s + (p.contas_alcancadas || 0), 0)
  const media  = posts.length > 0 ? Math.round(total / posts.length) : 0
  const melhor = posts.length > 0
    ? posts.reduce((a, b) => (a.contas_alcancadas || 0) > (b.contas_alcancadas || 0) ? a : b, posts[0])
    : null

  const values = {
    total:  { v: fmt(total),                     sub: 'contas alcançadas no mês' },
    media:  { v: fmt(media),                     sub: 'contas por publicação' },
    melhor: { v: fmt(melhor?.contas_alcancadas), sub: (melhor?.nome || melhor?.tema || '—').slice(0, 24) },
    count:  { v: String(posts.length),           sub: `${posts.filter(p => p.status === 'parcial').length} com dados parciais` },
  }

  return (
    <div className="kpi-grid" style={{ marginBottom: 14 }}>
      {CARDS.map(({ key, label, icon: Icon, accent, iconBg, highlight }) => {
        const { v, sub } = values[key]
        return (
          <div key={key} className="card kpi-card" style={{
            padding: '18px 20px',
            borderTop: highlight ? `3px solid ${accent}` : '3px solid transparent',
          }}>
            {/* Topo: ícone + label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{
                color: '#8A9BB0', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {label}
              </p>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} color={accent} strokeWidth={2.1} />
              </div>
            </div>

            {/* Número principal */}
            <p style={{
              color: '#182638', fontSize: 28, fontWeight: 800,
              lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              {v}
            </p>

            {/* Subtexto */}
            <p style={{
              color: '#A8B5C0', fontSize: 12,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {sub}
            </p>
          </div>
        )
      })}
    </div>
  )
}
