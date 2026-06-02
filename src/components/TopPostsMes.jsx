import { useState } from 'react'
import { Film, LayoutPanelLeft, Image } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'
import { temasLabel } from '../utils/temas'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const TIPO_COLOR = { Carrossel:'#F97316', Reels:'#182638', 'Foto estática':'#0EA5E9' }
const TIPO_BG    = { Carrossel:'rgba(249,115,22,0.08)', Reels:'rgba(24,38,56,0.08)', 'Foto estática':'rgba(14,165,233,0.08)' }
const TIPO_ICON  = { Reels: Film, Carrossel: LayoutPanelLeft, 'Foto estática': Image }

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// Medalhas: SVG discreto para top 3, número simples para 4º e 5º
function Position({ i }) {
  if (i >= 3) return (
    <span style={{ width: 22, textAlign: 'center', color: '#A8B5C0', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
      {i + 1}º
    </span>
  )
  const colors = [
    { fill: '#F59E0B', text: '#92400E' },  // ouro
    { fill: '#94A3B8', text: '#475569' },  // prata
    { fill: '#CD7C3A', text: '#7C2D12' },  // bronze
  ]
  const { fill } = colors[i]
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="9" fill={fill} opacity="0.18"/>
      <circle cx="10" cy="10" r="6" fill={fill} opacity="0.35"/>
      <text x="10" y="14" textAnchor="middle" fontSize="8" fontWeight="800"
        fill={fill} fontFamily="DM Sans, sans-serif">{i + 1}</text>
    </svg>
  )
}

export default function TopPostsMes() {
  const { getPostsDoMes, updatePost, deletePost, mesFiltro } = useStore()
  const posts = getPostsDoMes()
  const [editTarget, setEditTarget] = useState(null)

  const top5 = [...posts]
    .sort((a, b) => (b.contas_alcancadas || 0) - (a.contas_alcancadas || 0))
    .slice(0, 5)

  const [mm, yyyy] = (mesFiltro || '').split('/')
  const mesNome = mm ? `${MESES_FULL[parseInt(mm, 10) - 1]} ${yyyy}` : ''

  if (top5.length === 0) return null

  const maxVal = top5[0].contas_alcancadas || 1

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ color: '#182638', fontSize: 15, fontWeight: 700 }}>Top 5 posts</p>
          <p style={{ color: '#A8B5C0', fontSize: 12, marginTop: 2 }}>{mesNome} · por contas alcançadas</p>
        </div>
        <span style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
          {posts.length} posts no mês
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {top5.map((p, i) => {
          const color   = TIPO_COLOR[p.tipo] || '#0EA5E9'
          const bg      = TIPO_BG[p.tipo]    || 'rgba(14,165,233,0.08)'
          const pct     = maxVal > 0 ? ((p.contas_alcancadas || 0) / maxVal) * 100 : 0
          const TipoIcon = TIPO_ICON[p.tipo] || Image

          return (
            <div key={p.id}
              onClick={() => setEditTarget(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '9px 10px', borderRadius: 10, transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Posição */}
              <Position i={i} />

              {/* Ícone discreto do tipo */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: bg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TipoIcon size={14} color={color} strokeWidth={1.8} />
              </div>

              {/* Info + barra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#182638', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {p.nome || temasLabel(p) || '—'}
                </p>
                <div style={{ background: '#F0F2F5', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: i === 0 ? '#F97316' : color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Valor */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: i === 0 ? '#F97316' : '#182638', fontSize: 14, fontWeight: 800 }}>{fmt(p.contas_alcancadas)}</p>
                <p style={{ color: '#A8B5C0', fontSize: 10, marginTop: 1 }}>{p.data_post}</p>
              </div>
            </div>
          )
        })}
      </div>

      {editTarget && (
        <UploadModal mode="update" post={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={dados => { updatePost(editTarget.id, dados); setEditTarget(null) }}
          onDelete={() => { deletePost(editTarget.id); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
