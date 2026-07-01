import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const CONFIGS = [
  {
    id: 'Imagem',
    label: 'Imagem',
    color: '#0A66C2',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',  role: 'Distribuição' },
      { key: 'cliques',       label: 'Cliques',     role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',     role: 'Engajamento' },
    ],
  },
  {
    id: 'Documento',
    label: 'Documento',
    color: '#1C252E',
    metricas: [
      { key: 'impressoes', label: 'Impressões', role: 'Distribuição' },
      { key: 'cliques',    label: 'Cliques',    role: 'Ação' },
      { key: 'reacoes',    label: 'Reações',    role: 'Engajamento' },
    ],
  },
  {
    id: 'Vídeo',
    label: 'Vídeo',
    color: '#FF6200',
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
    color: '#5A7080',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    role: 'Distribuição' },
      { key: 'visualizacoes', label: 'Visualizações', role: 'Consumo' },
      { key: 'cliques',       label: 'Cliques',       role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',       role: 'Engajamento' },
    ],
  },
]

const FUNIL_OPACITY = { Distribuição: 1, Consumo: 0.65, Ação: 0.4, Engajamento: 0.2 }

function fmtN(n) {
  if (n == null || isNaN(n) || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function FormatoCard({ cfg, posts, ano, mobile }) {
  const ps = posts.filter(p => p.tipo === cfg.id)
  const [sel, setSel] = useState(cfg.metricas[0].key)

  if (ps.length === 0) {
    return (
      <div className="card" style={{ padding: '18px 20px', opacity: 0.45, borderTop: `3px solid ${cfg.color}30` }}>
        <p style={{ color: cfg.color, fontSize: 13, fontWeight: 700 }}>{cfg.label}</p>
        <p style={{ color: '#C0CEDA', fontSize: 12, marginTop: 4 }}>Sem posts em {ano}</p>
      </div>
    )
  }

  // Totais anuais
  const totals = {}
  cfg.metricas.forEach(m => {
    totals[m.key] = ps.reduce((s, p) => s + (Number(p[m.key]) || 0), 0)
  })
  const maxVal = totals.impressoes || 1

  // Dados mensais para a métrica selecionada
  const metricaSel = cfg.metricas.find(m => m.key === sel) || cfg.metricas[0]
  const monthData = MESES_LABEL.map((mes, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const mps = ps.filter(p => p.data_post?.split('/')?.[1] === mm)
    return {
      mes,
      mesFull: MESES_FULL[i],
      value: mps.reduce((s, p) => s + (Number(p[sel]) || 0), 0),
      count: mps.length,
    }
  })

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: `3px solid ${cfg.color}` }}>

      {/* Cabeçalho */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: cfg.color, fontSize: 14, fontWeight: 700 }}>{cfg.label}</p>
        <span style={{ background: `${cfg.color}12`, color: cfg.color, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
          {ps.length} post{ps.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Funil clicável */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cfg.metricas.map(m => {
          const val = totals[m.key] || 0
          const pct = Math.max((val / maxVal) * 100, val > 0 ? 3 : 0)
          const ativo = sel === m.key

          return (
            <button key={m.key} onClick={() => setSel(m.key)}
              style={{
                background: ativo ? `${cfg.color}08` : 'transparent',
                border: `1.5px solid ${ativo ? cfg.color + '30' : 'transparent'}`,
                borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: ativo ? cfg.color : '#EAECF0',
                    color: ativo ? '#fff' : '#6B7A8D',
                    borderRadius: 4, padding: '2px 7px',
                    fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                  }}>
                    {m.role}
                  </span>
                  <span style={{ color: ativo ? '#1C252E' : '#8A9BB0', fontSize: 12, fontWeight: ativo ? 600 : 400 }}>
                    {m.label}
                  </span>
                </div>
                <span style={{ color: ativo ? cfg.color : '#1C252E', fontSize: mobile ? 15 : 16, fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>
                  {fmtN(val)}
                </span>
              </div>
              {/* Barra de funil */}
              <div style={{ background: '#F0F4F8', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{
                  background: cfg.color,
                  opacity: FUNIL_OPACITY[m.role],
                  borderRadius: 4, height: '100%',
                  width: `${pct}%`,
                  transition: 'width 0.5s ease',
                }}/>
              </div>
            </button>
          )
        })}
      </div>

      {/* Gráfico da métrica selecionada */}
      <div style={{ padding: '14px 18px 16px' }}>
        <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {metricaSel.label} por mês
        </p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={monthData} barSize={mobile ? 8 : 14} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: '#C0CEDA', fontSize: 9 }} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                  <p style={{ fontWeight: 700, color: '#1C252E', marginBottom: 2 }}>{d.mesFull}</p>
                  <p style={{ color: cfg.color, fontWeight: 700 }}>{fmtN(d.value)} {metricaSel.label.toLowerCase()}</p>
                  {d.count > 0 && <p style={{ color: '#9AAAB8' }}>{d.count} post{d.count > 1 ? 's' : ''}</p>}
                </div>
              )
            }} cursor={{ fill: 'rgba(0,0,0,0.03)' }}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {monthData.map((e, i) => (
                <Cell key={i} fill={e.value === 0 ? '#F0F2F5' : cfg.color}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

export default function LinkedinPorFormato({ posts, ano }) {
  const mobile = useIsMobile()

  if (posts.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post LinkedIn em {ano}.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>
      {CONFIGS.map(cfg => (
        <FormatoCard key={cfg.id} cfg={cfg} posts={posts} ano={ano} mobile={mobile}/>
      ))}
    </div>
  )
}
