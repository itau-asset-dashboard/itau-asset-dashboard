import { useState } from 'react'
import { ArrowUpDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'
import { temasLabel } from '../utils/temas'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'K'
  return n.toLocaleString('pt-BR')
}

const BADGE = {
  Carrossel: { bg: 'rgba(255,98,0,0.1)', color: '#FF6200' },
  Reels: { bg: 'rgba(28,37,46,0.1)', color: '#1C252E' },
  'Foto estática': { bg: 'rgba(14,165,233,0.1)', color: '#0EA5E9' },
}

const PAGE_SIZE = 10

export default function PostsRanking() {
  const { getPostsDoMes, updatePost, deletePost } = useStore()
  const posts = getPostsDoMes()
  const [sortKey, setSortKey] = useState('contas_alcancadas')
  const [sortDir, setSortDir] = useState(-1)
  const [page, setPage] = useState(0)
  const [updateTarget, setUpdateTarget] = useState(null)

  const melhorId = posts.length > 0
    ? posts.reduce((a, b) => (a.contas_alcancadas || 0) > (b.contas_alcancadas || 0) ? a : b, posts[0]).id
    : null

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
    setPage(0)
  }

  const sorted = [...posts].sort((a, b) => {
    const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0
    if (typeof va === 'string') return sortDir * va.localeCompare(vb)
    return sortDir * (vb - va)
  })

  const pages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const eng = (p) => ((p.curtidas || 0) + (p.comentarios || 0) + (p.salvamentos || 0) + (p.compartilhamentos || 0))

  const Th = ({ k, children }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
      whiteSpace: 'nowrap', textAlign: 'left', userSelect: 'none', background: '#FAFBFC',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey === k && <ArrowUpDown size={11} color="#FF6200" />}
      </div>
    </th>
  )

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
      <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Ranking de posts</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>{posts.length} publicações</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }} className="scrollbar-thin">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th k="data_post">Data</Th>
              <Th k="tipo">Tipo</Th>
              <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC' }}>Post / Tema</th>
              <Th k="contas_alcancadas">Contas alc.</Th>
              <Th k="visualizacoes">Visualiz.</Th>
              <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC' }}>Engaj.</th>
              <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFBFC' }}></th>
              <th style={{ padding: '11px 14px', background: '#FAFBFC' }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const isMelhor = p.id === melhorId
              const isParcial = p.status === 'parcial'
              const badge = BADGE[p.tipo] || BADGE['Foto estática']
              return (
                <tr key={p.id}
                  style={{ borderTop: '1px solid #F5F7FA', cursor: 'pointer' }}
                  onClick={() => setUpdateTarget(p)}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', color: '#8A9BB0', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: badge.bg, color: badge.color,
                      borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700,
                    }}>{p.tipo}</span>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isMelhor && <span style={{ marginRight: 4 }}>⭐</span>}
                      {p.nome || '—'}
                    </p>
                    {temasLabel(p) && <p style={{ color: '#8A9BB0', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{temasLabel(p)}</p>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      color: '#FF6200', fontWeight: 700, fontSize: 14,
                      opacity: isParcial ? 0.7 : 1
                    }}>{fmt(p.contas_alcancadas)}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, opacity: isParcial ? 0.7 : 1 }}>{fmt(p.visualizacoes)}</td>
                  <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13 }}>{fmt(eng(p))}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {isParcial
                      ? <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>🕐 Parcial</span>
                      : <span style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>✓ Final</span>
                    }
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setUpdateTarget(p)}
                      style={{
                        background: '#F4F6F8', border: 'none', borderRadius: 8,
                        padding: '5px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: '#8A9BB0', fontSize: 12
                      }}>
                      <RefreshCw size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F5F7FA' }}>
          <span style={{ color: '#8A9BB0', fontSize: 12 }}>Página {page + 1} de {pages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={15} color="#1C252E" />
            </button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', opacity: page === pages - 1 ? 0.4 : 1 }}>
              <ChevronRight size={15} color="#1C252E" />
            </button>
          </div>
        </div>
      )}

      {updateTarget && (
        <UploadModal mode="update" post={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSave={(dados) => { updatePost(updateTarget.id, dados); setUpdateTarget(null) }}
          onDelete={() => { deletePost(updateTarget.id); setUpdateTarget(null) }}
        />
      )}
    </div>
  )
}
