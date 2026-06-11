/**
 * Componentes reutilizáveis para rankings de posts.
 * Usados em TopPostsMes, ETFsView, AnnualView, etc.
 */
import { Film, LayoutPanelLeft, Image } from 'lucide-react'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'K'
  return n.toLocaleString('pt-BR')
}

export const TIPO_COLOR = {
  Carrossel: '#F97316',
  Reels: '#182638',
  'Foto estática': '#0EA5E9',
}
export const TIPO_BG = {
  Carrossel: 'rgba(249,115,22,0.09)',
  Reels: 'rgba(24,38,56,0.08)',
  'Foto estática': 'rgba(14,165,233,0.09)',
}
const TIPO_ICON = {
  Reels: Film,
  Carrossel: LayoutPanelLeft,
  'Foto estática': Image,
}

// Pill de posição: ouro/prata/bronze para top 3, número simples depois
export function PositionPill({ i }) {
  if (i >= 3) {
    return (
      <span style={{
        width: 26, textAlign: 'center', flexShrink: 0,
        color: '#B0BEC5', fontSize: 11, fontWeight: 700,
      }}>
        {i + 1}º
      </span>
    )
  }
  const styles = [
    { bg: '#FEF3C7', color: '#B45309' },
    { bg: '#F1F5F9', color: '#64748B' },
    { bg: '#FEF0E7', color: '#9A5C2E' },
  ]
  const { bg, color } = styles[i]
  return (
    <span style={{
      width: 28, height: 22, borderRadius: 6,
      background: bg, color, fontSize: 11, fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {i + 1}º
    </span>
  )
}

// Linha padrão de ranking de post
export function PostRankRow({ post, i, maxVal, firstColor = '#F97316', onClick }) {
  const color    = TIPO_COLOR[post.tipo] || '#0EA5E9'
  const pct      = maxVal > 0 ? ((post.contas_alcancadas || 0) / maxVal) * 100 : 0
  const barColor = i === 0 ? firstColor : color

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px 10px', borderRadius: 10,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = '#F8FAFC' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = 'transparent' }}
    >
      <PositionPill i={i} />

      {/* Nome + barra */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: '#182638', fontSize: 13, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
        }}>
          {post.nome || post.tema || '—'}
        </p>
        <div style={{ background: '#F0F2F5', borderRadius: 3, height: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: barColor, width: `${pct}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Valor + data */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ color: i === 0 ? firstColor : '#182638', fontSize: 14, fontWeight: 800 }}>
          {fmt(post.contas_alcancadas)}
        </p>
        <p style={{ color: '#A8B5C0', fontSize: 10, marginTop: 1 }}>{post.data_post}</p>
      </div>
    </div>
  )
}
