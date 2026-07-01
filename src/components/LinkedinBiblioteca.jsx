import { useState, useMemo } from 'react'
import { Trash2, ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const TIPOS = ['Imagem', 'Vídeo', 'Artigo', 'Documento']

function fmtN(n) {
  if (n == null || n === '') return null
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}
function fmtCtr(n) {
  if (n == null || n === '') return null
  return Number(n).toFixed(2).replace('.',',') + '%'
}

// Quais métricas fazem sentido por formato
const METRICA_APPLIES = {
  visualizacoes: ['Vídeo', 'Artigo'],
  cliques:       ['Imagem', 'Documento', 'Artigo'],
  ctr:           ['Imagem', 'Documento'],
}

function cellApplies(tipo, metric) {
  const allowed = METRICA_APPLIES[metric]
  if (!allowed) return true
  if (!tipo) return true // sem tipo, mostra tudo
  return allowed.includes(tipo)
}

function parseDate(d) {
  if (!d) return 0
  const [dd, mm, yyyy] = d.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
}

export default function LinkedinBiblioteca({ allPosts, ano, isEditMode, onEditPost, onDeletePost }) {
  const mobile = useIsMobile()
  const [mesSel, setMesSel]   = useState(null)
  const [tipoSel, setTipoSel] = useState(null)
  const [temaSel, setTemaSel] = useState(null)
  const [autorSel, setAutorSel] = useState(null)
  const [sortKey, setSortKey] = useState('data_post')
  const [sortDir, setSortDir] = useState(-1)

  const postsAno = allPosts.filter(p => p.data_post?.split('/')?.[2] === ano)

  const filtered = useMemo(() => {
    let ps = postsAno
    if (mesSel !== null) {
      const mm = String(mesSel + 1).padStart(2, '0')
      ps = ps.filter(p => p.data_post?.split('/')?.[1] === mm)
    }
    if (tipoSel)  ps = ps.filter(p => p.tipo === tipoSel)
    if (temaSel)  ps = ps.filter(p => Array.isArray(p.tema) && p.tema.includes(temaSel))
    if (autorSel) ps = ps.filter(p => p.autor === autorSel)
    return ps
  }, [postsAno, mesSel, tipoSel, temaSel, autorSel])

  const allTemas  = [...new Set(postsAno.flatMap(p => Array.isArray(p.tema) ? p.tema : []))].sort()
  const allAutores = [...new Set(postsAno.map(p => p.autor).filter(Boolean))].sort()

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortKey === 'data_post') return sortDir * (parseDate(a.data_post) - parseDate(b.data_post))
    if (sortKey === 'nome') return sortDir * (a.nome || '').localeCompare(b.nome || '')
    return sortDir * ((a[sortKey] || 0) - (b[sortKey] || 0))
  }), [filtered, sortKey, sortDir])

  function toggleSort(k) {
    if (sortKey === k) setSortDir(d => -d)
    else { setSortKey(k); setSortDir(-1) }
  }

  const hasFilters = mesSel !== null || tipoSel || temaSel || autorSel

  const SortIcon = ({ k }) => sortKey !== k
    ? <ArrowUpDown size={10} color="#D0D8E0"/>
    : sortDir === -1 ? <ArrowDown size={10} color="#0A66C2"/> : <ArrowUp size={10} color="#0A66C2"/>

  const COLS = [
    { k: 'nome',          label: 'Post' },
    { k: null,            label: 'Tipo' },
    { k: 'data_post',     label: 'Data' },
    { k: 'impressoes',    label: 'Impressões' },
    { k: 'visualizacoes', label: 'Visualizações' },
    { k: 'cliques',       label: 'Cliques' },
    { k: 'ctr',           label: 'CTR' },
    { k: 'reacoes',       label: 'Reações' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Painel de filtros */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Filter size={13} color="#6B7A8D"/>
          <p style={{ color: '#6B7A8D', fontSize: 12, fontWeight: 600 }}>Filtros</p>
          {hasFilters && (
            <button onClick={() => { setMesSel(null); setTipoSel(null); setTemaSel(null); setAutorSel(null) }}
              style={{ marginLeft: 'auto', fontSize: 11, color: '#FF6200', background: 'rgba(255,98,0,0.08)', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Mês */}
        <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mês</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginBottom: 14 }}>
          {MESES_LABEL.map((m, i) => (
            <button key={i} onClick={() => setMesSel(mesSel === i ? null : i)}
              style={{
                padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: mesSel === i ? 700 : 400, textAlign: 'center',
                background: mesSel === i ? '#0A66C2' : '#F0F4F8',
                color: mesSel === i ? '#fff' : '#6B7A8D',
                transition: 'all 0.12s',
              }}>
              {m}
            </button>
          ))}
        </div>

        {/* Formato */}
        <div style={{ display: 'flex', gap: mobile ? 10 : 20, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Formato</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {TIPOS.map(t => (
                <button key={t} onClick={() => setTipoSel(tipoSel === t ? null : t)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    fontWeight: tipoSel === t ? 700 : 400,
                    background: tipoSel === t ? '#0A66C2' : '#fff',
                    color: tipoSel === t ? '#fff' : '#4A6272',
                    border: `1.5px solid ${tipoSel === t ? '#0A66C2' : '#E0E7EF'}`,
                    transition: 'all 0.12s',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {allTemas.length > 0 && (
            <div>
              <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tema</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {allTemas.map(t => (
                  <button key={t} onClick={() => setTemaSel(temaSel === t ? null : t)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      fontWeight: temaSel === t ? 700 : 400,
                      background: temaSel === t ? '#1C252E' : '#fff',
                      color: temaSel === t ? '#C3EBF7' : '#4A6272',
                      border: `1.5px solid ${temaSel === t ? '#1C252E' : '#E0E7EF'}`,
                      transition: 'all 0.12s',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allAutores.length > 0 && (
            <div>
              <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Autor</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {allAutores.map(a => (
                  <button key={a} onClick={() => setAutorSel(autorSel === a ? null : a)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      fontWeight: autorSel === a ? 700 : 400,
                      background: autorSel === a ? '#FF6200' : '#fff',
                      color: autorSel === a ? '#fff' : '#4A6272',
                      border: `1.5px solid ${autorSel === a ? '#FF6200' : '#E0E7EF'}`,
                      transition: 'all 0.12s',
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contagem */}
      <p style={{ color: '#6B7A8D', fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: '#1C252E' }}>{sorted.length}</span> publicações
        {mesSel !== null && ` em ${MESES_LABEL[mesSel]}`}
        {tipoSel && ` · ${tipoSel}`}
        {temaSel && ` · ${temaSel}`}
        {autorSel && ` · ${autorSel}`}
      </p>

      {/* Tabela */}
      {sorted.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post com esses filtros.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  {COLS.map(({ k, label }) => (
                    <th key={label} onClick={k ? () => toggleSort(k) : undefined}
                      style={{
                        padding: '9px 14px', color: sortKey === k ? '#0A66C2' : '#8A9BB0',
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        textAlign: 'left', cursor: k ? 'pointer' : 'default',
                        userSelect: 'none', whiteSpace: 'nowrap',
                      }}>
                      {k ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {label}<SortIcon k={k}/>
                        </div>
                      ) : label}
                    </th>
                  ))}
                  {isEditMode && <th style={{ background: '#FAFBFC', width: 40 }}/>}
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => {
                  const applies = (m) => cellApplies(p.tipo, m)

                  return (
                    <tr key={p.id}
                      onClick={() => isEditMode && onEditPost(p)}
                      style={{ borderTop: '1px solid #F5F7FA', cursor: isEditMode ? 'pointer' : 'default' }}
                      onMouseEnter={e => { if (isEditMode) e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                      <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                        <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome || '—'}</p>
                        {Array.isArray(p.tema) && p.tema.length > 0 && (
                          <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tema.join(' · ')}</p>
                        )}
                        {p.autor && <p style={{ color: '#C0CEDA', fontSize: 11, marginTop: 1 }}>{p.autor}</p>}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {p.tipo && (
                          <span style={{ background: '#F0F4F8', color: '#4A6272', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.tipo}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#9AAAB8', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#0A66C2', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {fmtN(p.impressoes) || '—'}
                      </td>
                      {/* Visualizações — só para Vídeo e Artigo */}
                      <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies('visualizacoes') ? '#1C252E' : '#E0E7EF' }}>
                        {applies('visualizacoes') ? (fmtN(p.visualizacoes) || '—') : '—'}
                      </td>
                      {/* Cliques — só para Imagem, Documento, Artigo */}
                      <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies('cliques') ? '#1C252E' : '#E0E7EF' }}>
                        {applies('cliques') ? (fmtN(p.cliques) || '—') : '—'}
                      </td>
                      {/* CTR — só para Imagem e Documento */}
                      <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap', color: applies('ctr') ? '#1C252E' : '#E0E7EF' }}>
                        {applies('ctr') ? (fmtCtr(p.ctr) || '—') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#1C252E', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {fmtN(p.reacoes) || '—'}
                      </td>
                      {isEditMode && (
                        <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
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
        </div>
      )}
    </div>
  )
}
