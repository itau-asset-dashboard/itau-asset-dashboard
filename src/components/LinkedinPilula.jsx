import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtN(n) {
  if (n == null || isNaN(n) || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function parseDate(d) {
  if (!d) return 0
  const [dd, mm, yyyy] = d.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
}

// Termômetro: retorna nível de performance relativo à média
function getPerf(val, media, max) {
  if (val == null || val === 0) return { nivel: 'sem', label: 'Sem dados', color: '#E8EDF2', bg: '#F5F7FA', score: 0 }
  const ratio = val / (media || 1)
  if (ratio >= 1.4)  return { nivel: 'top',   label: 'Destaque',    color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  score: ratio }
  if (ratio >= 0.8)  return { nivel: 'medio', label: 'Na média',    color: '#FF6200', bg: 'rgba(255,98,0,0.07)',   score: ratio }
  return               { nivel: 'baixo',  label: 'A melhorar',  color: '#e11d48', bg: 'rgba(225,29,72,0.07)',  score: ratio }
}

export default function LinkedinPilula({ posts, ano }) {
  const mobile = useIsMobile()
  const artigos = posts.filter(p => p.tipo === 'Artigo')
  const [sortKey, setSortKey] = useState('visualizacoes')

  if (artigos.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhuma Pílula de ETFs em {ano}.</p>
        <p style={{ color: '#C0CEDA', fontSize: 12, marginTop: 6 }}>Adicione posts do tipo Artigo para visualizar esta análise.</p>
      </div>
    )
  }

  // Totais anuais
  const totalVis  = artigos.reduce((s, p) => s + (Number(p.visualizacoes) || 0), 0)
  const totalImp  = artigos.reduce((s, p) => s + (Number(p.impressoes)    || 0), 0)
  const totalCli  = artigos.reduce((s, p) => s + (Number(p.cliques)       || 0), 0)
  const totalRea  = artigos.reduce((s, p) => s + (Number(p.reacoes)       || 0), 0)
  const totalPosts= artigos.length

  const KPIS = [
    { label: 'Visualizações', value: fmtN(totalVis),   sub: 'leituras totais',    accent: true },
    { label: 'Impressões',    value: fmtN(totalImp),   sub: 'alcance total' },
    { label: 'Cliques',       value: fmtN(totalCli),   sub: 'no conteúdo' },
    { label: 'Reações',       value: fmtN(totalRea),   sub: 'curtidas e reações' },
    { label: 'Pílulas',       value: String(totalPosts), sub: `publicadas em ${ano}` },
  ]

  // Evolução mensal
  const byMonth = MESES_LABEL.map((mes, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const ps = artigos.filter(p => p.data_post?.split('/')?.[1] === mm)
    return {
      mes, mesFull: MESES_FULL[i],
      visualizacoes: ps.reduce((s, p) => s + (Number(p.visualizacoes) || 0), 0),
      impressoes:    ps.reduce((s, p) => s + (Number(p.impressoes)    || 0), 0),
      count: ps.length,
    }
  })

  // Termômetro — médias por métrica
  const mediaVis = totalVis / (artigos.filter(p => Number(p.visualizacoes) > 0).length || 1)
  const mediaImp = totalImp / (artigos.filter(p => Number(p.impressoes)    > 0).length || 1)

  const sorted = [...artigos].sort((a, b) => {
    const va = Number(a[sortKey]) || 0
    const vb = Number(b[sortKey]) || 0
    return vb - va
  })

  const maxVis = Math.max(...artigos.map(p => Number(p.visualizacoes) || 0), 1)
  const maxImp = Math.max(...artigos.map(p => Number(p.impressoes)    || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPIs anuais */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: mobile ? 8 : 12 }}>
        {KPIS.map(({ label, value, sub, accent }) => (
          <div key={label} className="card" style={{ padding: mobile ? '12px 14px' : '16px 20px' }}>
            <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ color: accent ? '#FF6200' : '#1C252E', fontSize: mobile ? 20 : 24, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{value}</p>
            <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Evolução mensal — Visualizações + Impressões */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>Evolução mensal</p>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6200' }}/>
              <span style={{ color: '#6B7A8D', fontSize: 11 }}>Visualizações</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C3EBF7' }}/>
              <span style={{ color: '#6B7A8D', fontSize: 11 }}>Impressões</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={mobile ? 140 : 190}>
          <BarChart data={byMonth} barSize={mobile ? 10 : 16} barGap={3} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: '#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#9AAAB8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? '' : fmtN(v)} width={mobile ? 36 : 44}/>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#fff', border: '1px solid #EAECF0', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                  <p style={{ fontWeight: 700, color: '#1C252E', marginBottom: 4 }}>{d.mesFull}</p>
                  <p style={{ color: '#FF6200', fontWeight: 700 }}>{fmtN(d.visualizacoes)} visualizações</p>
                  <p style={{ color: '#5A7A8A' }}>{fmtN(d.impressoes)} impressões</p>
                  {d.count > 0 && <p style={{ color: '#9AAAB8', marginTop: 2 }}>{d.count} pílula{d.count > 1 ? 's' : ''}</p>}
                </div>
              )
            }} cursor={{ fill: 'rgba(0,0,0,0.02)' }}/>
            <Bar dataKey="impressoes" radius={[3,3,0,0]}>
              {byMonth.map((e, i) => <Cell key={i} fill={e.impressoes === 0 ? '#F0F2F5' : '#C3EBF7'}/>)}
            </Bar>
            <Bar dataKey="visualizacoes" radius={[3,3,0,0]}>
              {byMonth.map((e, i) => <Cell key={i} fill={e.visualizacoes === 0 ? '#F0F2F5' : '#FF6200'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Termômetro de performance */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>Termômetro de Pílulas</p>
            <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 2 }}>Compara cada pílula com a média do período</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { k: 'visualizacoes', label: 'Visualizações' },
              { k: 'impressoes',    label: 'Impressões' },
              { k: 'cliques',       label: 'Cliques' },
              { k: 'reacoes',       label: 'Reações' },
            ].map(({ k, label }) => (
              <button key={k} onClick={() => setSortKey(k)} style={{
                padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: sortKey === k ? 700 : 400,
                background: sortKey === k ? '#1C252E' : '#F0F4F8',
                color: sortKey === k ? '#C3EBF7' : '#6B7A8D',
                transition: 'all 0.12s',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ padding: '6px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((p, i) => {
            const valVis = Number(p.visualizacoes) || 0
            const valImp = Number(p.impressoes)    || 0
            const valSel = Number(p[sortKey])      || 0
            const mediaSel = sortKey === 'visualizacoes' ? mediaVis
                           : sortKey === 'impressoes'    ? mediaImp
                           : artigos.reduce((s, x) => s + (Number(x[sortKey]) || 0), 0) / (artigos.filter(x => Number(x[sortKey]) > 0).length || 1)
            const perf = getPerf(valSel, mediaSel)
            const barPct = Math.max((valSel / (Math.max(...artigos.map(x => Number(x[sortKey]) || 0), 1))) * 100, valSel > 0 ? 2 : 0)

            return (
              <div key={p.id} style={{
                background: i === 0 ? 'rgba(255,98,0,0.04)' : '#FAFBFC',
                border: `1px solid ${i === 0 ? 'rgba(255,98,0,0.12)' : '#F0F2F5'}`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Posição */}
                  <span style={{
                    color: i === 0 ? '#FF6200' : i < 3 ? '#0A66C2' : '#C0CEDA',
                    fontSize: 13, fontWeight: 700, flexShrink: 0, minWidth: 20, textAlign: 'center',
                  }}>
                    {i + 1}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Título + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{
                        color: '#1C252E', fontSize: 13, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: mobile ? 160 : 360,
                      }}>
                        {p.nome || '—'}
                      </span>
                      <span style={{
                        background: perf.bg, color: perf.color,
                        borderRadius: 20, padding: '2px 8px',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {perf.label}
                      </span>
                      {p.data_post && (
                        <span style={{ color: '#C0CEDA', fontSize: 11, flexShrink: 0 }}>{p.data_post}</span>
                      )}
                    </div>

                    {/* Barra de performance */}
                    <div style={{ background: '#EAECF0', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{
                        background: perf.color, borderRadius: 4, height: '100%',
                        width: `${barPct}%`, transition: 'width 0.5s ease',
                      }}/>
                    </div>

                    {/* Métricas */}
                    <div style={{ display: 'flex', gap: mobile ? 12 : 20, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ color: '#9AAAB8', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visualizações</p>
                        <p style={{ color: sortKey === 'visualizacoes' ? '#FF6200' : '#4A5568', fontSize: 14, fontWeight: sortKey === 'visualizacoes' ? 800 : 600, marginTop: 1 }}>{fmtN(valVis)}</p>
                      </div>
                      <div>
                        <p style={{ color: '#9AAAB8', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressões</p>
                        <p style={{ color: sortKey === 'impressoes' ? '#FF6200' : '#4A5568', fontSize: 14, fontWeight: sortKey === 'impressoes' ? 800 : 600, marginTop: 1 }}>{fmtN(valImp)}</p>
                      </div>
                      {Number(p.cliques) > 0 && (
                        <div>
                          <p style={{ color: '#9AAAB8', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliques</p>
                          <p style={{ color: sortKey === 'cliques' ? '#FF6200' : '#4A5568', fontSize: 14, fontWeight: sortKey === 'cliques' ? 800 : 600, marginTop: 1 }}>{fmtN(Number(p.cliques))}</p>
                        </div>
                      )}
                      {Number(p.reacoes) > 0 && (
                        <div>
                          <p style={{ color: '#9AAAB8', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reações</p>
                          <p style={{ color: sortKey === 'reacoes' ? '#FF6200' : '#4A5568', fontSize: 14, fontWeight: sortKey === 'reacoes' ? 800 : 600, marginTop: 1 }}>{fmtN(Number(p.reacoes))}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
