import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// Configuração fixa por formato — apenas as métricas que fazem sentido
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
    color: '#475569',
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
    color: '#16a34a',
    metricas: [
      { key: 'impressoes',    label: 'Impressões',    role: 'Distribuição' },
      { key: 'visualizacoes', label: 'Visualizações', role: 'Consumo' },
      { key: 'cliques',       label: 'Cliques',       role: 'Ação' },
      { key: 'reacoes',       label: 'Reações',       role: 'Engajamento' },
    ],
  },
]

// Cores consistentes por papel — iguais em todos os formatos
const ROLE_BADGE = {
  Distribuição: { bg: '#EFF6FF', color: '#1D4ED8' },
  Consumo:      { bg: '#FFF7ED', color: '#C2410C' },
  Ação:         { bg: '#F5F3FF', color: '#7C3AED' },
  Engajamento:  { bg: '#F0FDF4', color: '#15803D' },
}

// Opacidade de preenchimento da barra por papel (funil visual)
const ROLE_OPACITY = { Distribuição: 1, Consumo: 0.72, Ação: 0.48, Engajamento: 0.28 }

function fmtN(n) {
  if (n == null || isNaN(n) || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function FormatoCard({ cfg, posts, ano, mobile }) {
  const ps = posts.filter(p => p.tipo === cfg.id)

  // Dados anuais
  const totals = {}
  cfg.metricas.forEach(m => {
    totals[m.key] = ps.reduce((s, p) => s + (Number(p[m.key]) || 0), 0)
  })
  const maxVal = totals.impressoes || 1

  // Dados mensais para o gráfico
  const monthData = MESES_LABEL.map((mes, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const mps = ps.filter(p => p.data_post?.split('/')?.[1] === mm)
    return {
      mes,
      mesFull: MESES_FULL[i],
      impressoes: mps.reduce((s, p) => s + (p.impressoes || 0), 0),
      count: mps.length,
    }
  })

  if (ps.length === 0) {
    return (
      <div className="card" style={{ padding: '20px 18px', borderTop: `3px solid ${cfg.color}25`, opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: `${cfg.color}60` }}/>
          <p style={{ color: `${cfg.color}80`, fontSize: 14, fontWeight: 700 }}>{cfg.label}</p>
          <span style={{ color: '#C0CEDA', fontSize: 13 }}>— sem posts em {ano}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: `3px solid ${cfg.color}` }}>

      {/* Cabeçalho */}
      <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.color }}/>
          <p style={{ color: cfg.color, fontSize: 14, fontWeight: 700 }}>{cfg.label}</p>
        </div>
        <span style={{ background: `${cfg.color}15`, color: cfg.color, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
          {ps.length} post{ps.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Funil de métricas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cfg.metricas.map(m => {
            const val = totals[m.key] || 0
            const pct = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 2 : 0) : 0
            const badge = ROLE_BADGE[m.role]
            const opacity = ROLE_OPACITY[m.role]
            return (
              <div key={m.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      background: badge.bg, color: badge.color,
                      borderRadius: 4, padding: '2px 7px', fontSize: 10,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}>
                      {m.role}
                    </span>
                    <span style={{ color: '#6B7A8D', fontSize: 12 }}>{m.label}</span>
                  </div>
                  <span style={{ color: '#1C252E', fontSize: mobile ? 15 : 17, fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>
                    {fmtN(val)}
                  </span>
                </div>
                <div style={{ background: '#F0F4F8', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                  <div style={{
                    background: cfg.color,
                    opacity,
                    borderRadius: 6,
                    height: '100%',
                    width: `${pct}%`,
                    transition: 'width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
                  }}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* Gráfico mensal */}
        <div>
          <p style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Impressões por mês
          </p>
          <ResponsiveContainer width="100%" height={65}>
            <BarChart data={monthData} barSize={mobile ? 8 : 13} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#C0CEDA', fontSize: 9 }} axisLine={false} tickLine={false}/>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                    <p style={{ fontWeight: 700, color: '#1C252E', marginBottom: 2 }}>{d.mesFull}</p>
                    <p style={{ color: cfg.color, fontWeight: 700 }}>{fmtN(d.impressoes)} impressões</p>
                    {d.count > 0 && <p style={{ color: '#9AAAB8' }}>{d.count} post{d.count > 1 ? 's' : ''}</p>}
                  </div>
                )
              }} cursor={{ fill: 'rgba(0,0,0,0.03)' }}/>
              <Bar dataKey="impressoes" radius={[4,4,0,0]}>
                {monthData.map((e, i) => (
                  <Cell key={i} fill={e.impressoes === 0 ? '#F0F2F5' : cfg.color}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

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

  // Legenda de papéis
  const papeis = ['Distribuição', 'Consumo', 'Ação', 'Engajamento']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Legenda de papéis — consistente entre formatos */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 12, marginRight: 2 }}>Legenda:</p>
        {papeis.map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              background: ROLE_BADGE[r].bg, color: ROLE_BADGE[r].color,
              borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {r}
            </span>
          </div>
        ))}
      </div>

      {/* Grade 2×2: Imagem + Documento | Vídeo + Artigo */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {CONFIGS.map(cfg => (
          <FormatoCard key={cfg.id} cfg={cfg} posts={posts} ano={ano} mobile={mobile}/>
        ))}
      </div>
    </div>
  )
}
