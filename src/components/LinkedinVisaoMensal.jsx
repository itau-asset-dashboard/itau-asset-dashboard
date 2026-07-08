import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const BORDA = {
  Imagem:    '#0A66C2',
  Vídeo:     '#FF6200',
  Documento: '#1C252E',
  Artigo:    '#8A9BB0',
}

const CONFIGS = [
  {
    id: 'Imagem',
    label: 'Imagem',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    role: 'Distribuição' },
      { key: 'cliques',       label: 'Cliques',       role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',       role: 'Engajamento' },
    ],
  },
  {
    id: 'Documento',
    label: 'Documento',
    metricas: [
      { key: 'impressoes', label: 'Impressões', role: 'Distribuição' },
      { key: 'cliques',    label: 'Cliques',    role: 'Ação' },
      { key: 'reacoes',    label: 'Reações',    role: 'Engajamento' },
    ],
  },
  {
    id: 'Vídeo',
    label: 'Vídeo',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    role: 'Distribuição' },
      { key: 'visualizacoes', label: 'Visualizações', role: 'Consumo' },
      { key: 'cliques',       label: 'Cliques',       role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',       role: 'Engajamento' },
    ],
  },
  {
    id: 'Artigo',
    label: 'Artigo / Newsletter',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    role: 'Distribuição' },
      { key: 'visualizacoes', label: 'Visualizações', role: 'Consumo' },
      { key: 'cliques',       label: 'Cliques',       role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',       role: 'Engajamento' },
    ],
  },
]

function fmtN(n) {
  if (n == null || isNaN(n) || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function FormatoCard({ cfg, posts, mobile, isEditMode, onEditPost }) {
  const ps = posts.filter(p => p.tipo === cfg.id)
  const [expanded, setExpanded] = useState(false)

  if (ps.length === 0) return null

  const totals = {}
  cfg.metricas.forEach(m => {
    totals[m.key] = ps.reduce((s, p) => s + (Number(p[m.key]) || 0), 0)
  })
  const maxVal = Math.max(...cfg.metricas.map(m => totals[m.key] || 0), 1)
  const cor = BORDA[cfg.id] || '#1C252E'

  const psSorted = [...ps].sort((a, b) => (Number(b.impressoes) || 0) - (Number(a.impressoes) || 0))

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${cor}` }}>

      {/* Cabeçalho */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5F7FA' }}>
        <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>{cfg.label}</p>
        <span style={{ background: '#F5F7FA', color: '#6B7A8D', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
          {ps.length} post{ps.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Métricas com barrinha proporcional */}
      <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {cfg.metricas.map(m => {
          const val = totals[m.key] || 0
          const pct = Math.max((val / maxVal) * 100, val > 0 ? 2 : 0)
          return (
            <div key={m.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#6B7A8D', fontSize: 12 }}>{m.label}</span>
                <span style={{ color: '#1C252E', fontSize: 13, fontWeight: 700 }}>{fmtN(val)}</span>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                <div style={{ background: cor, borderRadius: 3, height: '100%', width: `${pct}%`, transition: 'width 0.5s ease' }}/>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toggle posts */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px', background: '#FAFBFC', border: 'none', borderTop: '1px solid #F0F4F8',
        cursor: 'pointer', color: '#6B7A8D', fontSize: 12, fontWeight: 600,
      }}>
        <span>Ver posts</span>
        {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
      </button>

      {/* Lista de posts colapsável */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F0F4F8' }}>
          {psSorted.map((p, i) => (
            <div key={p.id}
              onClick={() => isEditMode && onEditPost(p)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px', borderTop: i > 0 ? '1px solid #F5F7FA' : 'none',
                cursor: isEditMode ? 'pointer' : 'default', gap: 10,
              }}
              onMouseEnter={e => { if (isEditMode) e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={e => { e.currentTarget.style.background = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ color: i === 0 ? cor : '#C0CEDA', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ color: '#1C252E', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nome || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                {cfg.metricas.slice(0, 2).map(m => (
                  <span key={m.key} style={{ fontSize: 11, color: '#8A9BB0' }}>
                    <span style={{ color: '#1C252E', fontWeight: 600 }}>{fmtN(Number(p[m.key]) || 0)}</span>
                    {' '}{m.label.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LinkedinVisaoMensal({ posts, mes, isEditMode, onEditPost }) {
  const mobile = useIsMobile()
  const mesNome = MESES_FULL[parseInt(mes, 10) - 1] || mes
  const [formatoFiltro, setFormatoFiltro] = useState(null)

  // Só mostra formatos que têm posts
  const formatosComPosts = useMemo(() => CONFIGS.filter(cfg => posts.some(p => p.tipo === cfg.id)), [posts])

  const totalImpressoes   = posts.reduce((s, p) => s + (Number(p.impressoes)    || 0), 0)
  const totalVisualizacoes= posts.reduce((s, p) => s + (Number(p.visualizacoes) || 0), 0)
  const totalCliques      = posts.reduce((s, p) => s + (Number(p.cliques)       || 0), 0)
  const totalReacoes      = posts.reduce((s, p) => s + (Number(p.reacoes)       || 0), 0)
  const totalPosts        = posts.length

  const KPIS = [
    { label: 'Impressões',    value: fmtN(totalImpressoes),    sub: 'alcance total' },
    { label: 'Visualizações', value: fmtN(totalVisualizacoes), sub: 'vídeos e artigos' },
    { label: 'Cliques',       value: fmtN(totalCliques),       sub: 'no conteúdo' },
    { label: 'Reações',       value: fmtN(totalReacoes),       sub: 'curtidas e reações' },
    { label: 'Posts',         value: String(totalPosts),       sub: `publicações em ${mesNome}` },
  ]

  if (posts.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post em {mesNome}.</p>
        <p style={{ color: '#C0CEDA', fontSize: 12, marginTop: 6 }}>Selecione outro mês ou adicione posts.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPIs do mês */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: mobile ? 8 : 12 }}>
        {KPIS.map(({ label, value, sub }) => (
          <div key={label} className="card" style={{ padding: mobile ? '12px 14px' : '16px 20px' }}>
            <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ color: '#1C252E', fontSize: mobile ? 20 : 24, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{value}</p>
            <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filtro de formato — só no mobile */}
      {mobile && formatosComPosts.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFormatoFiltro(null)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: !formatoFiltro ? 700 : 400,
            background: !formatoFiltro ? '#1C252E' : '#F0F4F8',
            color: !formatoFiltro ? '#C3EBF7' : '#4A6272',
            border: !formatoFiltro ? '1.5px solid #1C252E' : '1.5px solid #E0E7EF',
          }}>Todos</button>
          {formatosComPosts.map(cfg => (
            <button key={cfg.id} onClick={() => setFormatoFiltro(cfg.id === formatoFiltro ? null : cfg.id)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontWeight: formatoFiltro === cfg.id ? 700 : 400,
              background: formatoFiltro === cfg.id ? BORDA[cfg.id] : '#F0F4F8',
              color: formatoFiltro === cfg.id ? '#fff' : '#4A6272',
              border: formatoFiltro === cfg.id ? `1.5px solid ${BORDA[cfg.id]}` : '1.5px solid #E0E7EF',
            }}>{cfg.label}</button>
          ))}
        </div>
      )}

      {/* Cards por formato */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {CONFIGS.filter(cfg => !mobile || !formatoFiltro || cfg.id === formatoFiltro).map(cfg => (
          <FormatoCard key={cfg.id} cfg={cfg} posts={posts} mobile={mobile} isEditMode={isEditMode} onEditPost={onEditPost}/>
        ))}
      </div>

    </div>
  )
}
