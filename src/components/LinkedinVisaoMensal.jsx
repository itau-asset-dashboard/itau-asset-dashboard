import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

function FormatoCard({ cfg, posts, mobile }) {
  const ps = posts.filter(p => p.tipo === cfg.id)
  const [sel, setSel] = useState(cfg.metricas[0].key)

  if (ps.length === 0) return null

  const totals = {}
  cfg.metricas.forEach(m => {
    totals[m.key] = ps.reduce((s, p) => s + (Number(p[m.key]) || 0), 0)
  })
  const maxVal = totals.impressoes || 1
  const metricaSel = cfg.metricas.find(m => m.key === sel) || cfg.metricas[0]

  // Gráfico: posts do mês por dia (ou lista simples já que é um mês)
  const postsDados = ps.map((p, i) => ({
    label: p.data_post?.split('/')?.[0] ? `${p.data_post.split('/')[0]}` : `Post ${i+1}`,
    nome: p.nome || `Post ${i+1}`,
    value: Number(p[sel]) || 0,
  }))

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${BORDA[cfg.id] || '#EAECF0'}` }}>

      {/* Cabeçalho */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5F7FA' }}>
        <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>{cfg.label}</p>
        <span style={{ background: '#F5F7FA', color: '#6B7A8D', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
          {ps.length} post{ps.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Métricas funil */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {cfg.metricas.map(m => {
          const val = totals[m.key] || 0
          const pct = Math.max((val / maxVal) * 100, val > 0 ? 2 : 0)
          const ativo = sel === m.key

          return (
            <button key={m.key} onClick={() => setSel(m.key)}
              style={{
                background: ativo ? '#FAFBFC' : 'transparent',
                border: `1px solid ${ativo ? '#EAECF0' : 'transparent'}`,
                borderRadius: 8, padding: '8px 10px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: ativo ? '#1C252E' : '#EAECF0',
                    color: ativo ? '#C3EBF7' : '#5A6A7A',
                    borderRadius: 4, padding: '2px 7px',
                    fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    transition: 'all 0.12s', flexShrink: 0,
                  }}>
                    {m.role}
                  </span>
                  <span style={{ color: ativo ? '#1C252E' : '#6B7A8D', fontSize: 12, fontWeight: ativo ? 600 : 500, transition: 'color 0.12s' }}>
                    {m.label}
                  </span>
                </div>
                <span style={{
                  color: ativo ? '#FF6200' : '#8A9BB0',
                  fontSize: mobile ? 15 : 17, fontWeight: ativo ? 800 : 600,
                  flexShrink: 0, marginLeft: 8, transition: 'color 0.12s',
                }}>
                  {fmtN(val)}
                </span>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                <div style={{
                  background: ativo ? '#1C252E' : '#BCC8D4',
                  borderRadius: 3, height: '100%', width: `${pct}%`,
                  transition: 'width 0.5s ease, background 0.12s',
                }}/>
              </div>
            </button>
          )
        })}
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: '#F5F7FA', margin: '4px 0' }}/>

      {/* Gráfico por post */}
      <div style={{ padding: '10px 20px 16px' }}>
        <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {metricaSel.label} · por post
        </p>
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={postsDados} barSize={mobile ? 10 : 16} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: '#C0CEDA', fontSize: 9 }} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 8, padding: '6px 10px', fontSize: 11, maxWidth: 200 }}>
                  <p style={{ fontWeight: 700, color: '#1C252E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nome}</p>
                  <p style={{ color: '#FF6200', fontWeight: 700 }}>{fmtN(d.value)} {metricaSel.label.toLowerCase()}</p>
                </div>
              )
            }} cursor={{ fill: 'rgba(0,0,0,0.02)' }}/>
            <Bar dataKey="value" radius={[3,3,0,0]}>
              {postsDados.map((e, i) => (
                <Cell key={i} fill={e.value === 0 ? '#F0F2F5' : '#C3EBF7'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function LinkedinVisaoMensal({ posts, mes, isEditMode, onEditPost }) {
  const mobile = useIsMobile()
  const mesNome = MESES_FULL[parseInt(mes, 10) - 1] || mes

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

      {/* Cards por formato */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {CONFIGS.map(cfg => (
          <FormatoCard key={cfg.id} cfg={cfg} posts={posts} mobile={mobile}/>
        ))}
      </div>

    </div>
  )
}
