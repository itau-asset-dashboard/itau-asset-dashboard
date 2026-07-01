import { useState, useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const PAGE_SIZE = 10

function fmtN(n) {
  if (n == null || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}
function fmtCtr(n) {
  if (n == null || n === '') return '—'
  return Number(n).toFixed(2).replace('.',',') + '%'
}
function parseDate(d) {
  if (!d) return 0
  const [dd, mm, yyyy] = d.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
}

const APPLIES = {
  visualizacoes: ['Vídeo', 'Artigo'],
  cliques:       ['Imagem', 'Documento', 'Artigo'],
  ctr:           ['Imagem', 'Documento'],
}
function applies(tipo, metric) {
  const a = APPLIES[metric]
  if (!a || !tipo) return true
  return a.includes(tipo)
}

const TIPO_COLOR = {
  Imagem:    { bg: 'rgba(10,102,194,0.1)',  color: '#0A66C2' },
  Vídeo:     { bg: 'rgba(255,98,0,0.1)',    color: '#FF6200' },
  Documento: { bg: 'rgba(28,37,46,0.1)',    color: '#1C252E' },
  Artigo:    { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' },
}

export default function LinkedinBiblioteca({ allPosts, mesFiltro, isEditMode, onEditPost, onDeletePost }) {
  const mobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('data_post')
  const [sortDir, setSortDir] = useState(-1)
  const [page, setPage]       = useState(0)

  // mesFiltro = "MM/YYYY"
  const [mmF, yyyyF] = (mesFiltro || '').split('/')
  const postsMes = allPosts.filter(p => {
    const pts = p.data_post?.split('/')
    return pts?.[1] === mmF && pts?.[2] === yyyyF
  })
  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return postsMes
    return allPosts.filter(p =>
      (p.nome      || '').toLowerCase().includes(q) ||
      (p.data_post || '').toLowerCase().includes(q) ||
      (p.tipo      || '').toLowerCase().includes(q) ||
      (Array.isArray(p.tema) ? p.tema.join(' ') : '').toLowerCase().includes(q)
    )
  }, [allPosts, postsMes, q])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortKey === 'data_post') return sortDir * (parseDate(a.data_post) - parseDate(b.data_post))
    if (sortKey === 'nome') return sortDir * (a.nome || '').localeCompare(b.nome || '')
    return sortDir * ((a[sortKey] || 0) - (b[sortKey] || 0))
  }), [filtered, sortKey, sortDir])

  const pages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const topId = postsMes.length ? [...postsMes].sort((a,b)=>(b.impressoes||0)-(a.impressoes||0))[0]?.id : null

  function toggleSort(k) {
    if (sortKey === k) setSortDir(d => -d)
    else { setSortKey(k); setSortDir(-1) }
    setPage(0)
  }

  const SortIcon = ({ k }) => sortKey !== k
    ? <ArrowUpDown size={11} color="#D0D8E0"/>
    : sortDir === -1 ? <ArrowDown size={11} color="#0A66C2"/> : <ArrowUp size={11} color="#0A66C2"/>

  const Th = ({ k, children }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding: '11px 14px', color: sortKey === k ? '#0A66C2' : '#8A9BB0',
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap',
      textAlign: 'left', userSelect: 'none', background: '#FAFBFC',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{children}<SortIcon k={k}/></div>
    </th>
  )

  return (
    <div className="card" style={{ overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Posts LinkedIn</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>
            {q ? `${sorted.length} resultado${sorted.length !== 1 ? 's' : ''} em todos os posts` : `${filtered.length} publicação${filtered.length !== 1 ? 'ões' : ''} no mês`}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F5F7FA', borderRadius: 10,
          border: `1.5px solid ${q ? '#0A66C2' : '#EDEFF2'}`,
          padding: '7px 12px', transition: 'border-color 0.15s',
          flex: mobile ? '1 1 100%' : '0 0 auto',
          minWidth: mobile ? 0 : 240,
        }}>
          <Search size={14} color={q ? '#0A66C2' : '#A8B5C0'} style={{ flexShrink: 0 }}/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por nome, data, tipo, autor..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#182638', width: '100%', fontFamily: 'DM Sans, sans-serif' }}/>
          {q && (
            <button onClick={() => { setSearch(''); setPage(0) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} color="#A8B5C0"/>
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {sorted.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #F0F4F8' }}>
          <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post encontrado.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr>
                <Th k="data_post">Data</Th>
                <Th k="nome">Post / Tema</Th>
                <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC', whiteSpace: 'nowrap' }}>Tipo</th>
                <Th k="impressoes">Impressões</Th>
                <Th k="visualizacoes">Visual.</Th>
                <Th k="cliques">Cliques</Th>
                <Th k="ctr">CTR</Th>
                <Th k="reacoes">Reações</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const tc = TIPO_COLOR[p.tipo]
                return (
                  <tr key={p.id}
                    onClick={() => isEditMode && onEditPost(p)}
                    style={{ borderTop: '1px solid #F5F7FA', cursor: isEditMode ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (isEditMode) e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                    <td style={{ padding: '11px 14px', color: '#9AAAB8', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post || '—'}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                      <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.id === topId && !q && (
                          <span style={{ background: 'rgba(255,98,0,0.1)', color: '#FF6200', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, marginRight: 5 }}>Top</span>
                        )}
                        {p.nome || '—'}
                      </p>
                      {Array.isArray(p.tema) && p.tema.length > 0 && (
                        <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tema.join(' · ')}</p>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {p.tipo && (
                        <span style={{ background: tc?.bg || '#F0F4F8', color: tc?.color || '#4A6272', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.tipo}</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#0A66C2', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtN(p.impressoes)}</td>
                    <td style={{ padding: '11px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.visualizacoes)}</td>
                    <td style={{ padding: '11px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.cliques)}</td>
                    <td style={{ padding: '11px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtCtr(p.ctr)}</td>
                    <td style={{ padding: '11px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.reacoes)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#9AAAB8', fontSize: 12 }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ background: '#F5F7FA', border: '1.5px solid #EDEFF2', borderRadius: 8, padding: '5px 8px', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, display: 'flex' }}>
              <ChevronLeft size={14} color="#6B7A8D"/>
            </button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              style={{ background: '#F5F7FA', border: '1.5px solid #EDEFF2', borderRadius: 8, padding: '5px 8px', cursor: page === pages - 1 ? 'not-allowed' : 'pointer', opacity: page === pages - 1 ? 0.4 : 1, display: 'flex' }}>
              <ChevronRight size={14} color="#6B7A8D"/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
