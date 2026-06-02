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

const MESES = ['Todos','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const PAGE_SIZE = 10

export default function PostsRanking() {
  const { posts: allPosts, mesFiltro, updatePost, deletePost } = useStore()

  // Filtro local — por padrão mostra o ano do filtro global, mês = Todos
  const anoGlobal = mesFiltro?.split('/')?.[1] || String(new Date().getFullYear())
  const anos = [...new Set(allPosts.map(p => p.data_post?.split('/')?.[2]).filter(Boolean))].sort()

  const [anoSel, setAnoSel]   = useState(anoGlobal)
  const [mesSel, setMesSel]   = useState(0)            // 0 = Todos, 1-12 = mês
  const [sortKey, setSortKey] = useState('contas_alcancadas')
  const [sortDir, setSortDir] = useState(-1)
  const [page, setPage]       = useState(0)
  const [updateTarget, setUpdateTarget] = useState(null)

  // Filtra por ano + mês local
  const posts = allPosts.filter(p => {
    const pts = p.data_post?.split('/')
    if (!pts || pts.length < 3) return false
    if (pts[2] !== anoSel) return false
    if (mesSel !== 0 && parseInt(pts[1], 10) !== mesSel) return false
    return true
  })

  const melhorId = posts.length > 0
    ? posts.reduce((a, b) => (a.contas_alcancadas || 0) > (b.contas_alcancadas || 0) ? a : b, posts[0]).id
    : null

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
    setPage(0)
  }

  function setMes(m) { setMesSel(m); setPage(0) }
  function setAno(a) { setAnoSel(a); setPage(0) }

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

      {/* Header + filtros */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Todos os posts</h2>
            <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>{posts.length} publicações</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Seletor de ano */}
            {anos.length > 1 && (
              <div style={{ display: 'flex', background: 'rgba(28,37,46,0.06)', borderRadius: 10, padding: 3, gap: 2 }}>
                {anos.map(a => (
                  <button key={a} onClick={() => setAno(a)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: anoSel === a ? 700 : 400,
                      background: anoSel === a ? '#1C252E' : 'transparent',
                      color: anoSel === a ? '#C3EBF7' : '#5A7080',
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            )}

            {/* Seletor de mês */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {MESES.map((m, i) => (
                <button key={i} onClick={() => setMes(i)}
                  style={{
                    padding: '5px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: mesSel === i ? 700 : 400,
                    background: mesSel === i ? '#FF6200' : 'rgba(255,98,0,0.07)',
                    color: mesSel === i ? '#fff' : '#FF6200',
                    transition: 'all 0.12s',
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AAAB8', fontSize: 13 }}>
                  Nenhum post encontrado para este período
                </td>
              </tr>
            )}
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
                    <span style={{ color: '#FF6200', fontWeight: 700, fontSize: 14, opacity: isParcial ? 0.7 : 1 }}>
                      {fmt(p.contas_alcancadas)}
                    </span>
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
                        color: '#8A9BB0', fontSize: 12,
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
