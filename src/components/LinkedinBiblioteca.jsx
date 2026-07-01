import { useState, useMemo, useCallback } from 'react'
import { Trash2, ArrowDown, ArrowUp, ArrowUpDown, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const TIPOS = ['Imagem', 'Vídeo', 'Artigo', 'Documento']
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

// Quais métricas fazem sentido por formato
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

export default function LinkedinBiblioteca({ allPosts, ano, isEditMode, onEditPost, onDeletePost }) {
  const mobile = useIsMobile()
  const [search, setSearch]     = useState('')
  const [mesSel, setMesSel]     = useState(null)
  const [tipoSel, setTipoSel]   = useState(null)
  const [temaSel, setTemaSel]   = useState(null)
  const [sortKey, setSortKey]   = useState('data_post')
  const [sortDir, setSortDir]   = useState(-1)
  const [page, setPage]         = useState(0)

  const postsAno = allPosts.filter(p => p.data_post?.split('/')?.[2] === ano)

  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    let ps = q
      ? allPosts.filter(p =>
          (p.nome        || '').toLowerCase().includes(q) ||
          (p.data_post   || '').toLowerCase().includes(q) ||
          (p.tipo        || '').toLowerCase().includes(q) ||
          (p.autor       || '').toLowerCase().includes(q) ||
          (Array.isArray(p.tema) ? p.tema.join(' ') : '').toLowerCase().includes(q)
        )
      : postsAno

    if (!q) {
      if (mesSel !== null) {
        const mm = String(mesSel + 1).padStart(2, '0')
        ps = ps.filter(p => p.data_post?.split('/')?.[1] === mm)
      }
      if (tipoSel)  ps = ps.filter(p => p.tipo === tipoSel)
      if (temaSel)  ps = ps.filter(p => Array.isArray(p.tema) && p.tema.includes(temaSel))
    }
    return ps
  }, [allPosts, postsAno, q, mesSel, tipoSel, temaSel])

  const allTemas = [...new Set(postsAno.flatMap(p => Array.isArray(p.tema) ? p.tema : []))].sort()

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortKey === 'data_post') return sortDir * (parseDate(a.data_post) - parseDate(b.data_post))
    if (sortKey === 'nome') return sortDir * (a.nome || '').localeCompare(b.nome || '')
    return sortDir * ((a[sortKey] || 0) - (b[sortKey] || 0))
  }), [filtered, sortKey, sortDir])

  const pages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const topId = postsAno.length ? [...postsAno].sort((a,b)=>(b.impressoes||0)-(a.impressoes||0))[0]?.id : null

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}<SortIcon k={k}/>
      </div>
    </th>
  )

  const hasFilters = mesSel !== null || tipoSel || temaSel

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Card principal — busca + filtros + tabela */}
      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Header: título + busca */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid #F0F4F8' }}>
          <div>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Posts LinkedIn</h2>
            <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>
              {q ? `${sorted.length} resultado${sorted.length !== 1 ? 's' : ''} em todos os posts` : `${filtered.length} publicações em ${ano}`}
            </p>
          </div>
          {/* Busca */}
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

        {/* Filtros — só mostram sem busca ativa */}
        {!q && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #F0F4F8', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Meses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
              {MESES_LABEL.map((m, i) => (
                <button key={i} onClick={() => { setMesSel(mesSel === i ? null : i); setPage(0) }}
                  style={{
                    padding: '5px 2px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: mesSel === i ? 700 : 400, textAlign: 'center',
                    background: mesSel === i ? '#0A66C2' : '#F0F4F8',
                    color: mesSel === i ? '#fff' : '#6B7A8D', transition: 'all 0.12s',
                  }}>
                  {m}
                </button>
              ))}
            </div>
            {/* Tipo + Tema */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {TIPOS.map(t => (
                <button key={t} onClick={() => { setTipoSel(tipoSel === t ? null : t); setPage(0) }}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    fontWeight: tipoSel === t ? 700 : 400,
                    background: tipoSel === t ? (TIPO_COLOR[t]?.color || '#1C252E') : '#F5F7FA',
                    color: tipoSel === t ? '#fff' : '#4A6272',
                    border: `1.5px solid ${tipoSel === t ? (TIPO_COLOR[t]?.color || '#1C252E') : '#E0E7EF'}`,
                    transition: 'all 0.12s',
                  }}>
                  {t}
                </button>
              ))}
              {allTemas.length > 0 && (
                <>
                  <div style={{ width: 1, height: 18, background: '#E8ECF0', margin: '0 4px' }}/>
                  {allTemas.map(t => (
                    <button key={t} onClick={() => { setTemaSel(temaSel === t ? null : t); setPage(0) }}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        fontWeight: temaSel === t ? 700 : 400,
                        background: temaSel === t ? '#1C252E' : '#F5F7FA',
                        color: temaSel === t ? '#C3EBF7' : '#4A6272',
                        border: `1.5px solid ${temaSel === t ? '#1C252E' : '#E0E7EF'}`,
                        transition: 'all 0.12s',
                      }}>
                      {t}
                    </button>
                  ))}
                </>
              )}
              {hasFilters && (
                <button onClick={() => { setMesSel(null); setTipoSel(null); setTemaSel(null); setPage(0) }}
                  style={{ marginLeft: 'auto', fontSize: 11, color: '#9AAAB8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Resumo rápido quando busca ativa */}
        {q && sorted.length > 0 && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #F0F4F8', background: '#FAFBFC', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Impressões', value: fmtN(sorted.reduce((s,p)=>s+(p.impressoes||0),0)) },
              { label: 'Cliques',    value: fmtN(sorted.reduce((s,p)=>s+(p.cliques||0),0)) },
              { label: 'Reações',    value: fmtN(sorted.reduce((s,p)=>s+(p.reacoes||0),0)) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#B0BEC5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#1C252E' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabela */}
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post encontrado.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr>
                  <Th k="nome">Post</Th>
                  <th style={{ padding: '11px 14px', color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#FAFBFC', whiteSpace: 'nowrap' }}>Tipo</th>
                  <Th k="data_post">Data</Th>
                  <Th k="impressoes">Impressões</Th>
                  <Th k="visualizacoes">Visual.</Th>
                  <Th k="cliques">Cliques</Th>
                  <Th k="ctr">CTR</Th>
                  <Th k="reacoes">Reações</Th>
                  {isEditMode && <th style={{ background: '#FAFBFC', width: 40 }}/>}
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
                      <td style={{ padding: '11px 14px', maxWidth: 220 }}>
                        <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.id === topId && !q && !hasFilters && (
                            <span style={{ background: 'rgba(255,98,0,0.1)', color: '#FF6200', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, marginRight: 5 }}>Top</span>
                          )}
                          {p.nome || '—'}
                        </p>
                        {Array.isArray(p.tema) && p.tema.length > 0 && (
                          <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tema.join(' · ')}</p>
                        )}
                        {p.autor && <p style={{ color: '#C8D2DA', fontSize: 11, marginTop: 1 }}>{p.autor}</p>}
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {p.tipo && (
                          <span style={{ background: tc?.bg || '#F0F4F8', color: tc?.color || '#4A6272', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.tipo}</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#9AAAB8', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post || '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#0A66C2', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtN(p.impressoes)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies(p.tipo,'visualizacoes') ? '#1C252E' : '#E0E7EF' }}>
                        {applies(p.tipo,'visualizacoes') ? fmtN(p.visualizacoes) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies(p.tipo,'cliques') ? '#1C252E' : '#E0E7EF' }}>
                        {applies(p.tipo,'cliques') ? fmtN(p.cliques) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies(p.tipo,'ctr') ? '#1C252E' : '#E0E7EF' }}>
                        {applies(p.tipo,'ctr') ? fmtCtr(p.ctr) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtN(p.reacoes)}</td>
                      {isEditMode && (
                        <td style={{ padding: '11px 10px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => onDeletePost(p.id)}
                            style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                            <Trash2 size={12}/>
                          </button>
                        </td>
                      )}
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
    </div>
  )
}
