import { useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Search, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'
import { temasLabel, getTemas } from '../utils/temas'
import { useIsMobile } from '../utils/useIsMobile'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'K'
  return n.toLocaleString('pt-BR')
}

const BADGE = {
  Carrossel: { bg: 'rgba(249,115,22,0.1)', color: '#F97316' },
  Reels: { bg: 'rgba(28,37,46,0.1)', color: '#1C252E' },
  'Foto estática': { bg: 'rgba(14,165,233,0.1)', color: '#0EA5E9' },
}

const PAGE_SIZE = 10

function parseDate(d) {
  if (!d) return 0
  const [dd, mm, yyyy] = d.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
}

export default function PostsRanking() {
  const { getPostsDoMes, posts: allPosts, updatePost, deletePost } = useStore()
  const mobile = useIsMobile()

  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState('data_post')
  const [sortDir, setSortDir]   = useState(-1)
  const [page, setPage]         = useState(0)
  const [updateTarget, setUpdateTarget] = useState(null)

  const q = search.trim().toLowerCase()

  // Com busca: todos os posts. Sem busca: filtro de mês normal
  const basePosts = q
    ? allPosts.filter(p => {
        const nome  = (p.nome || '').toLowerCase()
        const data  = (p.data_post || '').toLowerCase()
        const tipo  = (p.tipo || '').toLowerCase()
        const temas = temasLabel(p).toLowerCase()
        return nome.includes(q) || data.includes(q) || tipo.includes(q) || temas.includes(q)
      })
    : getPostsDoMes()

  const posts = basePosts

  const melhorId = posts.length > 0
    ? posts.reduce((a, b) => (a.contas_alcancadas || 0) > (b.contas_alcancadas || 0) ? a : b, posts[0]).id
    : null

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
    setPage(0)
  }

  const sorted = [...posts].sort((a, b) => {
    if (sortKey === 'data_post') return sortDir * (parseDate(a.data_post) - parseDate(b.data_post))
    return sortDir * ((a[sortKey] ?? 0) - (b[sortKey] ?? 0))
  })

  const pages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const eng = (p) => ((p.curtidas || 0) + (p.comentarios || 0) + (p.salvamentos || 0) + (p.compartilhamentos || 0))

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown size={11} color="#D0D8E0" />
    return sortDir === -1 ? <ArrowDown size={11} color="#F97316" /> : <ArrowUp size={11} color="#F97316" />
  }

  const Th = ({ k, children }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding: '11px 14px', color: sortKey === k ? '#F97316' : '#8A9BB0',
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap',
      textAlign: 'left', userSelect: 'none', background: '#FAFBFC',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        <SortIcon k={k} />
      </div>
    </th>
  )

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Ranking de posts</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>
            {q ? `${posts.length} resultado${posts.length !== 1 ? 's' : ''} em todos os posts` : `${posts.length} publicações`}
          </p>
        </div>
        {/* Campo de busca */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F5F7FA', borderRadius: 10,
          border: `1.5px solid ${q ? '#F97316' : '#EDEFF2'}`,
          padding: '7px 12px',
          transition: 'border-color 0.15s',
          flex: mobile ? '1 1 100%' : '0 0 auto',
          minWidth: mobile ? 0 : 220,
        }}>
          <Search size={14} color={q ? '#F97316' : '#A8B5C0'} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por nome, data, tema..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: '#182638', width: '100%',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          {q && (
            <button onClick={() => { setSearch(''); setPage(0) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} color="#A8B5C0" />
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="scrollbar-thin">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th k="data_post">Data</Th>
              <th style={{ padding: mobile ? '10px 10px' : '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC' }}>
                {mobile ? 'Post' : 'Post / Tema'}
              </th>
              <Th k="contas_alcancadas">Alcance</Th>
              {!mobile && <Th k="visualizacoes">Visual.</Th>}
              {!mobile && <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC' }}>Engaj.</th>}
              {!mobile && <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC' }}>Status</th>}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={mobile ? 3 : 6} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AAAB8', fontSize: 13 }}>
                  Nenhum post encontrado para este período
                </td>
              </tr>
            )}
            {visible.map((p) => {
              const isMelhor = p.id === melhorId
              const isParcial = p.status === 'parcial'
              const badge = BADGE[p.tipo] || BADGE['Foto estática']
              const tipoAbrev = p.tipo === 'Foto estática' ? 'Foto' : p.tipo
              return (
                <tr key={p.id}
                  style={{ borderTop: '1px solid #F5F7FA', cursor: 'pointer' }}
                  onClick={() => setUpdateTarget(p)}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: mobile ? '10px 8px' : '12px 14px', color: '#8A9BB0', fontSize: mobile ? 11 : 12, whiteSpace: 'nowrap' }}>{p.data_post}</td>
                  <td style={{ padding: mobile ? '10px 8px' : '12px 14px', overflow: 'hidden' }}>
                    <p style={{ color: '#1C252E', fontSize: mobile ? 12 : 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: mobile ? 160 : 200 }}>
                      {isMelhor && <span style={{ marginRight: 4 }}>⭐</span>}
                      {p.nome || '—'}
                    </p>
                    {mobile
                      ? <span style={{ background: badge.bg, color: badge.color, borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{tipoAbrev}</span>
                      : temasLabel(p) && <p style={{ color: '#8A9BB0', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{temasLabel(p)}</p>
                    }
                  </td>
                  <td style={{ padding: mobile ? '10px 8px' : '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#F97316', fontWeight: 700, fontSize: mobile ? 13 : 14, opacity: isParcial ? 0.7 : 1 }}>{fmt(p.contas_alcancadas)}</span>
                    {mobile && isParcial && <span style={{ display: 'block', color: '#f59e0b', fontSize: 9, fontWeight: 600 }}>Parcial</span>}
                  </td>
                  {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, opacity: isParcial ? 0.7 : 1 }}>{fmt(p.visualizacoes)}</td>}
                  {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13 }}>{fmt(eng(p))}</td>}
                  {!mobile && (
                    <td style={{ padding: '12px 14px' }}>
                      {isParcial
                        ? <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>Parcial</span>
                        : <span style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>Final</span>
                      }
                    </td>
                  )}
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
