import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const FORMATO_COLORS = {
  Imagem:    '#0A66C2',
  Vídeo:     '#FF6200',
  Documento: '#1C252E',
  Artigo:    '#16a34a',
}

function fmtN(n) {
  if (n == null || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

export default function LinkedinVisaoGeral({ posts, ano, isEditMode, onEditPost }) {
  const mobile = useIsMobile()
  const [rankKey, setRankKey] = useState('impressoes')
  const [rankDir, setRankDir] = useState(-1)
  const [tipoFiltro, setTipoFiltro] = useState(null)

  const tiposDisponiveis = [...new Set(posts.map(p => p.tipo).filter(Boolean))]

  const totalImpressoes = posts.reduce((s, p) => s + (p.impressoes || 0), 0)
  const totalReacoes    = posts.reduce((s, p) => s + (p.reacoes    || 0), 0)
  const totalCliques    = posts.reduce((s, p) => s + (p.cliques    || 0), 0)
  const totalPosts      = posts.length

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const ps = posts.filter(p => p.data_post?.split('/')?.[1] === mm)
    return {
      mes:        MESES_LABEL[i],
      mesFull:    MESES_FULL[i],
      impressoes: ps.reduce((s, p) => s + (p.impressoes || 0), 0),
      count:      ps.length,
    }
  })

  const formatoCounts = Object.entries(
    posts.reduce((acc, p) => {
      const f = p.tipo || 'Sem tipo'
      acc[f] = (acc[f] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  function toggleRank(k) {
    if (rankKey === k) setRankDir(d => -d)
    else { setRankKey(k); setRankDir(-1) }
  }
  const SortIcon = ({ k }) => rankKey !== k
    ? <ArrowUpDown size={10} color="#D0D8E0"/>
    : rankDir === -1 ? <ArrowDown size={10} color="#0A66C2"/> : <ArrowUp size={10} color="#0A66C2"/>

  const top10 = [...posts]
    .filter(p => !tipoFiltro || p.tipo === tipoFiltro)
    .sort((a, b) => rankDir * ((a[rankKey] || 0) - (b[rankKey] || 0)))
    .slice(0, 10)

  if (posts.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post LinkedIn em {ano}.</p>
      </div>
    )
  }

  const KPIS = [
    { label: 'Impressões',  value: fmtN(totalImpressoes), sub: 'total distribuição' },
    { label: 'Reações',     value: fmtN(totalReacoes),    sub: 'curtidas e reações' },
    { label: 'Cliques',     value: fmtN(totalCliques),    sub: 'no conteúdo' },
    { label: 'Publicações', value: String(totalPosts),    sub: `posts em ${ano}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mobile ? 8 : 12 }}>
        {KPIS.map(({ label, value, sub }) => (
          <div key={label} className="card" style={{ padding: mobile ? '12px 14px' : '16px 20px' }}>
            <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ color: '#1C252E', fontSize: mobile ? 20 : 24, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{value}</p>
            <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap: 14 }}>
        {/* Impressões por mês */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Impressões por mês</p>
          <ResponsiveContainer width="100%" height={mobile ? 140 : 200}>
            <BarChart data={byMonth} barSize={mobile ? 14 : 22} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#9AAAB8', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '' : fmtN(v)} width={mobile ? 36 : 44}/>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                    <p style={{ fontWeight: 700, color: '#1C252E', marginBottom: 2 }}>{d.mesFull}</p>
                    <p style={{ color: '#0A66C2', fontWeight: 700 }}>{fmtN(d.impressoes)} impressões</p>
                    <p style={{ color: '#9AAAB8' }}>{d.count} post{d.count !== 1 ? 's' : ''}</p>
                  </div>
                )
              }} cursor={{ fill: 'rgba(0,0,0,0.03)' }}/>
              <Bar dataKey="impressoes" radius={[5,5,0,0]}>
                {byMonth.map((e, i) => <Cell key={i} fill={e.impressoes === 0 ? '#F0F2F5' : '#1C252E'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Formatos publicados — lista limpa */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Formatos publicados</p>
          {formatoCounts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {formatoCounts.map(([tipo, count], i) => (
                <div key={tipo} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < formatoCounts.length-1 ? '1px solid #F0F2F5' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background: FORMATO_COLORS[tipo] || '#C3EBF7' }}/>
                    <span style={{ color:'#1C252E', fontSize: i===0?14:13, fontWeight:500 }}>{tipo}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ color: i===0?'#FF6200':'#1C252E', fontSize: i===0?15:13, fontWeight:500 }}>{count} post{count>1?'s':''}</span>
                    <span style={{ color:'#9AAAB8', fontSize:11, marginLeft:6 }}>{Math.round((count/totalPosts)*100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9AAAB8', fontSize: 13 }}>Sem dados de formato.</p>
          )}
        </div>
      </div>


      {/* Ranking de posts */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4F8', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700, marginRight: 4 }}>Ranking de posts</p>

          {/* Métrica */}
          <div style={{ display:'inline-flex', background:'#F0F2F5', borderRadius:10, padding:3, gap:2 }}>
            {['impressoes', 'cliques', 'reacoes'].map(k => (
              <button key={k} onClick={() => toggleRank(k)} style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: rankKey === k ? 600 : 400,
                background: rankKey === k ? '#fff' : 'transparent',
                color: rankKey === k ? '#1C252E' : '#8A9BB0',
                boxShadow: rankKey === k ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}>
                {k === 'impressoes' ? 'Impressões' : k === 'cliques' ? 'Cliques' : 'Reações'}
              </button>
            ))}
          </div>

          {/* Filtro de formato */}
          {tiposDisponiveis.length > 1 && (
            <div style={{ display:'inline-flex', background:'#F0F2F5', borderRadius:10, padding:3, gap:2 }}>
              <button onClick={() => setTipoFiltro(null)} style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: !tipoFiltro ? 600 : 400,
                background: !tipoFiltro ? '#fff' : 'transparent',
                color: !tipoFiltro ? '#1C252E' : '#8A9BB0',
                boxShadow: !tipoFiltro ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}>Todos</button>
              {tiposDisponiveis.map(t => (
                <button key={t} onClick={() => setTipoFiltro(tipoFiltro === t ? null : t)} style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: tipoFiltro === t ? 600 : 400,
                  background: tipoFiltro === t ? '#fff' : 'transparent',
                  color: tipoFiltro === t ? '#1C252E' : '#8A9BB0',
                  boxShadow: tipoFiltro === t ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: mobile ? 0 : 500 }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>#</th>
                <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>Post</th>
                {!mobile && <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>Tipo</th>}
                {mobile ? (
                  <th onClick={() => {}} style={{ padding: '9px 14px', color: '#0A66C2', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>
                    {rankKey === 'impressoes' ? 'Impr.' : rankKey === 'cliques' ? 'Cliques' : 'Reações'}
                  </th>
                ) : (
                  ['impressoes', 'cliques', 'reacoes'].map(k => (
                    <th key={k} onClick={() => toggleRank(k)} style={{
                      padding: '9px 14px', color: rankKey === k ? '#0A66C2' : '#8A9BB0',
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                      textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {k === 'impressoes' ? 'Impressões' : k === 'cliques' ? 'Cliques' : 'Reações'}
                        <SortIcon k={k}/>
                      </div>
                    </th>
                  ))
                )}
                {!mobile && <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>Data</th>}
              </tr>
            </thead>
            <tbody>
              {top10.map((p, i) => (
                <tr key={p.id}
                  onClick={() => isEditMode && onEditPost(p)}
                  style={{ borderTop: '1px solid #F5F7FA', cursor: isEditMode ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (isEditMode) e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: i === 0 ? '#FF6200' : i < 3 ? '#0A66C2' : '#C0CEDA', fontSize: 13, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: mobile ? 160 : 200 }}>
                    <p style={{ color: '#1C252E', fontSize: mobile ? 12 : 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome || '—'}</p>
                    {mobile && p.tipo && (
                      <span style={{ background: '#F0F4F8', color: '#4A6272', borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{p.tipo}</span>
                    )}
                  </td>
                  {!mobile && (
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#9AAAB8', fontSize: 12 }}>
                      {p.tipo || '—'}
                    </td>
                  )}
                  {mobile ? (
                    <td style={{ padding: '10px 14px', color: '#0A66C2', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{fmtN(p[rankKey])}</td>
                  ) : (
                    <>
                      <td style={{ padding: '10px 14px', color: rankKey === 'impressoes' ? '#0A66C2' : '#1C252E', fontSize: 13, fontWeight: rankKey === 'impressoes' ? 700 : 400, whiteSpace: 'nowrap' }}>{fmtN(p.impressoes)}</td>
                      <td style={{ padding: '10px 14px', color: rankKey === 'cliques' ? '#0A66C2' : '#1C252E', fontSize: 13, fontWeight: rankKey === 'cliques' ? 700 : 400, whiteSpace: 'nowrap' }}>{fmtN(p.cliques)}</td>
                      <td style={{ padding: '10px 14px', color: rankKey === 'reacoes' ? '#0A66C2' : '#1C252E', fontSize: 13, fontWeight: rankKey === 'reacoes' ? 700 : 400, whiteSpace: 'nowrap' }}>{fmtN(p.reacoes)}</td>
                      <td style={{ padding: '10px 14px', color: '#9AAAB8', fontSize: 12, whiteSpace: 'nowrap' }}>{p.data_post || '—'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
