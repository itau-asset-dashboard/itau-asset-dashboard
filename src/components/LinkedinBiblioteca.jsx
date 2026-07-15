import { useState, useMemo, useCallback } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'
import LinkedinUploadModal from './LinkedinUploadModal'

const PAGE_SIZE = 10

function fmtN(n) {
  if (n == null || n === '' || n === 0) return '—'
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

const TIPO_COLOR = {
  Imagem:    { bg: '#F0F4F8', color: '#8A9BB0' },
  Vídeo:     { bg: '#F0F4F8', color: '#8A9BB0' },
  Documento: { bg: '#F0F4F8', color: '#8A9BB0' },
  Artigo:    { bg: '#F0F4F8', color: '#8A9BB0' },
}

export default function LinkedinBiblioteca({ allPosts, mesFiltro, isEditMode, onEditPost, onDeletePost, onDeleteMany }) {
  const mobile = useIsMobile()
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState('data_post')
  const [sortDir, setSortDir] = useState(-1)
  const [page, setPage]       = useState(0)

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

  const pages   = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const topId   = postsMes.length ? [...postsMes].sort((a,b)=>(b.impressoes||0)-(a.impressoes||0))[0]?.id : null

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
    <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Ranking de posts</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>
            {q ? `${sorted.length} resultado${sorted.length !== 1 ? 's' : ''} em todos os posts` : `${filtered.length} publicações`}
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
            placeholder="Buscar por nome, data, tipo..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#182638', width: '100%', fontFamily: 'DM Sans, sans-serif' }}/>
          {q && (
            <button onClick={() => { setSearch(''); setPage(0) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} color="#A8B5C0"/>
            </button>
          )}
        </div>
      </div>

      {/* Resumo quando há busca ativa */}
      {q && sorted.length > 0 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F2F5', borderBottom: '1px solid #F0F2F5', background: '#FAFBFC', display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Posts',      value: sorted.length, color: '#1C252E', fmt: v => v },
            { label: 'Impressões', value: sorted.reduce((s,p)=>s+(Number(p.impressoes)||0),0), color: '#0A66C2', fmt: fmtN },
            { label: 'Cliques',    value: sorted.reduce((s,p)=>s+(Number(p.cliques)||0),0),    color: '#1C252E', fmt: fmtN },
            { label: 'Reações',    value: sorted.reduce((s,p)=>s+(Number(p.reacoes)||0),0),    color: '#1C252E', fmt: fmtN },
          ].map(({ label, value, color, fmt }) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#B0BEC5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{fmt(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {sorted.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #F0F4F8' }}>
          <p style={{ color: '#9AAAB8', fontSize: 13 }}>Nenhum post encontrado para este período.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="scrollbar-thin">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: mobile ? 0 : 680 }}>
            <thead>
              <tr>
                <Th k="data_post">Data</Th>
                <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC', whiteSpace: 'nowrap' }}>
                  {mobile ? 'Post' : 'Post / Tema'}
                </th>
                {!mobile && <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC', whiteSpace: 'nowrap' }}>Tipo</th>}
                <Th k="impressoes">Impres.</Th>
                {!mobile && <Th k="visualizacoes">Visual.</Th>}
                {!mobile && <Th k="cliques">Cliques</Th>}
                {!mobile && <Th k="ctr">CTR</Th>}
                {!mobile && <Th k="reacoes">Reações</Th>}
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const tc = TIPO_COLOR[p.tipo]
                const isTop = p.id === topId && !q
                return (
                  <tr key={p.id}
                    onClick={() => isEditMode && onEditPost(p)}
                    style={{ borderTop: '1px solid #F5F7FA', cursor: isEditMode ? 'pointer' : 'default', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '12px 14px', color: '#8A9BB0', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post || '—'}</td>
                    <td style={{ padding: '12px 14px', overflow: 'hidden' }}>
                      <p style={{ color: '#1C252E', fontSize: mobile ? 12 : 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: mobile ? 160 : 260 }}>
                        {isTop && <span style={{ marginRight: 4 }}>⭐</span>}
                        {p.nome || '—'}
                      </p>
                      {mobile
                        ? tc && <span style={{ background: tc.bg, color: tc.color, borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{p.tipo}</span>
                        : Array.isArray(p.tema) && p.tema.length > 0 && (
                            <p style={{ color: '#8A9BB0', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tema.join(' · ')}</p>
                          )
                      }
                    </td>
                    {!mobile && (
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {p.tipo && (
                          <span style={{ background: tc?.bg || '#F0F4F8', color: tc?.color || '#4A6272', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.tipo}</span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#0A66C2', fontWeight: 700, fontSize: mobile ? 13 : 14 }}>{fmtN(p.impressoes)}</span>
                    </td>
                    {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.visualizacoes)}</td>}
                    {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.cliques)}</td>}
                    {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtCtr(p.ctr)}</td>}
                    {!mobile && <td style={{ padding: '12px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.reacoes)}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F5F7FA' }}>
          <span style={{ color: '#8A9BB0', fontSize: 12 }}>Página {page + 1} de {pages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={15} color="#1C252E"/>
            </button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', opacity: page === pages - 1 ? 0.4 : 1 }}>
              <ChevronRight size={15} color="#1C252E"/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
