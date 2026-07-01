import { useState } from 'react'
import { useIsMobile } from '../utils/useIsMobile'

const FORMATO_DEFS = [
  {
    id: 'Imagem',
    label: 'Imagem',
    color: '#0A66C2',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',  tipo: 'total' },
      { key: 'cliques',       label: 'Cliques',     tipo: 'total' },
      { key: 'ctr',           label: 'CTR médio',   tipo: 'media' },
      { key: 'reacoes',       label: 'Reações',     tipo: 'total' },
    ],
    insight: 'Distribuição → Interação (cliques) → Engajamento',
  },
  {
    id: 'Vídeo',
    label: 'Vídeo',
    color: '#FF6200',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',      tipo: 'total' },
      { key: 'visualizacoes', label: 'Visualizações',   tipo: 'total' },
      { key: 'taxa_viz',      label: 'Taxa de visual.', tipo: 'calculado', sub: 'viz ÷ impressões' },
      { key: 'reacoes',       label: 'Reações',         tipo: 'total' },
    ],
    insight: 'Distribuição → Consumo (visualizações) → Engajamento',
  },
  {
    id: 'Documento',
    label: 'Documento',
    color: '#1C252E',
    metricas: [
      { key: 'impressoes', label: 'Impressões', tipo: 'total' },
      { key: 'cliques',    label: 'Cliques',    tipo: 'total' },
      { key: 'ctr',        label: 'CTR médio',  tipo: 'media' },
      { key: 'reacoes',    label: 'Reações',    tipo: 'total' },
    ],
    insight: 'Distribuição → Interação (cliques) → Engajamento',
  },
  {
    id: 'Artigo',
    label: 'Artigo / Newsletter',
    color: '#16a34a',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    tipo: 'total' },
      { key: 'visualizacoes', label: 'Visualizações', tipo: 'total' },
      { key: 'reacoes',       label: 'Reações',       tipo: 'total' },
    ],
    insight: 'Distribuição → Leitura (visualizações) → Engajamento',
  },
]

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
function fmtPct(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(1).replace('.',',') + '%'
}

function FormatoSection({ def, posts, ano }) {
  const mobile = useIsMobile()
  const ps = posts.filter(p => p.tipo === def.id)
  const count = ps.length

  if (count === 0) {
    return (
      <div className="card" style={{ padding: '18px 20px', borderLeft: `4px solid ${def.color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: `${def.color}50` }}/>
          <p style={{ color: `${def.color}90`, fontSize: 14, fontWeight: 700 }}>{def.label}</p>
          <span style={{ color: '#C0CEDA', fontSize: 13 }}>— sem posts em {ano}</span>
        </div>
      </div>
    )
  }

  // Calcula totais e médias
  const totalImp  = ps.reduce((s, p) => s + (p.impressoes    || 0), 0)
  const totalViz  = ps.reduce((s, p) => s + (p.visualizacoes || 0), 0)
  const totalClk  = ps.reduce((s, p) => s + (p.cliques       || 0), 0)
  const totalRea  = ps.reduce((s, p) => s + (p.reacoes       || 0), 0)
  const ctrPs     = ps.filter(p => p.ctr != null && p.ctr !== '')
  const mediaCtr  = ctrPs.length ? ctrPs.reduce((s, p) => s + (p.ctr || 0), 0) / ctrPs.length : null
  const taxaViz   = totalImp > 0 ? (totalViz / totalImp) * 100 : null

  function getValue(m) {
    if (m.key === 'taxa_viz')   return fmtPct(taxaViz)
    if (m.key === 'ctr')        return fmtCtr(mediaCtr)
    if (m.key === 'impressoes') return fmtN(totalImp)
    if (m.key === 'visualizacoes') return fmtN(totalViz)
    if (m.key === 'cliques')    return fmtN(totalClk)
    if (m.key === 'reacoes')    return fmtN(totalRea)
    return '—'
  }

  const topPost = [...ps].sort((a, b) => (b.impressoes || 0) - (a.impressoes || 0))[0]

  // Médias por post
  const medias = [
    { label: 'impressões', value: Math.round(totalImp / count) },
    totalViz > 0 && { label: 'visual.', value: Math.round(totalViz / count) },
    totalClk > 0 && { label: 'cliques', value: Math.round(totalClk / count) },
    { label: 'reações', value: Math.round(totalRea / count) },
  ].filter(Boolean)

  return (
    <div className="card" style={{ padding: 20, borderLeft: `4px solid ${def.color}` }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: def.color, flexShrink: 0 }}/>
            <p style={{ color: def.color, fontSize: 15, fontWeight: 700 }}>{def.label}</p>
          </div>
          <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 3, paddingLeft: 18 }}>{def.insight}</p>
        </div>
        <span style={{ background: `${def.color}12`, color: def.color, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {count} post{count > 1 ? 's' : ''}
        </span>
      </div>

      {/* Métricas em cards */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : `repeat(${def.metricas.length},1fr)`, gap: mobile ? 8 : 10, marginBottom: 14 }}>
        {def.metricas.map(m => (
          <div key={m.key} style={{ background: `${def.color}08`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{m.label}</p>
            <p style={{ color: def.color, fontSize: mobile ? 18 : 22, fontWeight: 800, lineHeight: 1 }}>{getValue(m)}</p>
            {m.sub && <p style={{ color: '#B0BEC5', fontSize: 10, marginTop: 3 }}>{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Média por post */}
      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 14px', marginBottom: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexBasis: '100%', marginBottom: 4 }}>Média por post</p>
        {medias.map(({ label, value }) => (
          <span key={label} style={{ color: '#4A5568', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#1C252E' }}>{fmtN(value)}</span> {label}
          </span>
        ))}
      </div>

      {/* Top post */}
      {topPost && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: `${def.color}08`, borderRadius: 10 }}>
          <span style={{ fontSize: 18 }}>🥇</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#1C252E', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topPost.nome || '—'}</p>
            <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 1 }}>{topPost.data_post} · {fmtN(topPost.impressoes)} impressões</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LinkedinPorFormato({ posts, ano }) {
  const [sel, setSel] = useState(null)

  const displayed = sel ? FORMATO_DEFS.filter(f => f.id === sel) : FORMATO_DEFS
  const formatsComPosts = new Set(posts.map(p => p.tipo).filter(Boolean))

  if (posts.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post LinkedIn em {ano}.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filtro de formato */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 12, marginRight: 2 }}>Mostrar:</p>
        <button onClick={() => setSel(null)} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
          fontWeight: sel === null ? 700 : 400,
          background: sel === null ? '#1C252E' : '#fff',
          color: sel === null ? '#C3EBF7' : '#4A6272',
          border: `1.5px solid ${sel === null ? '#1C252E' : '#E0E7EF'}`,
        }}>
          Todos
        </button>
        {FORMATO_DEFS.map(f => (
          <button key={f.id} onClick={() => setSel(sel === f.id ? null : f.id)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            fontWeight: sel === f.id ? 700 : 400,
            background: sel === f.id ? f.color : '#fff',
            color: sel === f.id ? '#fff' : formatsComPosts.has(f.id) ? '#4A6272' : '#C0CEDA',
            border: `1.5px solid ${sel === f.id ? f.color : '#E0E7EF'}`,
            opacity: !formatsComPosts.has(f.id) && sel === null ? 0.55 : 1,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {displayed.map(def => (
        <FormatoSection key={def.id} def={def} posts={posts} ano={ano}/>
      ))}
    </div>
  )
}
