import { useState } from 'react'
import { useStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Edit2, Check } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',')+'K'
  return Number(n).toLocaleString('pt-BR')
}

// Números Oliver sempre exatos, sem abreviação
function fmtExato(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  return Number(n).toLocaleString('pt-BR')
}

function pctDiff(a, b) {
  if (!a || !b) return null
  return ((a - b) / b * 100).toFixed(1)
}

export default function OliverView() {
  const { posts, mesFiltro, oliverData, setOliverData } = useStore()
  const ano = mesFiltro?.split('/')?.[1] || '2026'
  const mobile = useIsMobile()

  const [editingMes, setEditingMes] = useState(null)
  const [inputVal, setInputVal]     = useState({ alcance_oliver: '', meta_oliver: '' })

  // Dados mensais do Instagram (calculados automaticamente)
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mm     = String(i + 1).padStart(2, '0')
    const chave  = `${mm}/${ano}`
    const mesPost = posts.filter(p => {
      const pts = p.data_post?.split('/')
      return pts?.[1] === mm && pts?.[2] === ano
    })
    const alcanceInsta = mesPost.reduce((s, p) => s + (p.contas_alcancadas || 0), 0)
    const oliver       = oliverData[chave] || {}
    return {
      mes:            MESES_LABEL[i],
      mesFull:        MESES_FULL[i],
      chave,
      alcance_insta:  alcanceInsta,
      alcance_oliver: oliver.alcance_oliver ? Number(oliver.alcance_oliver) : null,
      meta_oliver:    oliver.meta_oliver    ? Number(oliver.meta_oliver)    : null,
      nPosts:         mesPost.length,
    }
  })

  function startEdit(chave, dados) {
    setEditingMes(chave)
    setInputVal({
      alcance_oliver: dados.alcance_oliver ?? '',
      meta_oliver:    dados.meta_oliver    ?? '',
    })
  }

  function saveEdit(chave) {
    setOliverData(chave, {
      alcance_oliver: inputVal.alcance_oliver !== '' ? Number(inputVal.alcance_oliver) : null,
      meta_oliver:    inputVal.meta_oliver    !== '' ? Number(inputVal.meta_oliver)    : null,
    })
    setEditingMes(null)
  }

  // Dados para o gráfico — só meses com algum dado
  const chartData = meses.filter(m => m.alcance_insta > 0 || m.alcance_oliver)

  // KPIs totais do ano
  const totalInsta  = meses.reduce((s, m) => s + m.alcance_insta, 0)
  const totalOliver = meses.reduce((s, m) => s + (m.alcance_oliver || 0), 0)
  const diff        = totalOliver > 0 ? pctDiff(totalOliver, totalInsta) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <h2 style={{ color: '#1C252E', fontSize: mobile ? 16 : 20, fontWeight: 800 }}>Acompanhamento Oliver</h2>
        <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 2 }}>
          Comparativo Oliver vs Instagram · {ano}
        </p>
      </div>

      {/* KPIs */}
      <style>{`@media(max-width:768px){.kpi-grid-js{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}.kpi-card-js{padding:11px 11px!important}.kpi-label-js{font-size:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin-bottom:7px!important}.kpi-number-js{font-size:19px!important;margin-bottom:3px!important}.kpi-sub-js{font-size:9px!important}}`}</style>
      <div className="kpi-grid-js" style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mobile ? 8 : 14, marginBottom:14 }}>
        {[
          { label: 'Total Instagram (ano)', value: fmt(totalInsta),  color: '#1C252E', bg: 'rgba(28,37,46,0.06)',      desc: 'Soma das contas alcançadas via Instagram' },
          { label: 'Total Oliver (ano)',    value: fmtExato(totalOliver || null), color: '#F97316', bg: 'rgba(249,115,22,0.08)', desc: 'Soma dos dados da agência' },
          { label: 'Diferença acumulada',  value: diff ? `${diff > 0 ? '+' : ''}${diff}%` : '—',
            color: diff == null ? '#9AAAB8' : diff > 0 ? '#16a34a' : '#ef4444',
            bg: diff == null ? '#F4F6F8' : diff > 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
            desc: 'Oliver vs Instagram (+ = Oliver maior)' },
          { label: 'Meses preenchidos',    value: String(meses.filter(m => m.alcance_oliver).length) + ' / 12',
            color: '#0891B2', bg: 'rgba(8,145,178,0.08)', desc: 'Meses com dado Oliver inserido' },
        ].map(({ label, value, color, bg, desc }) => (
          <div key={label} className="card kpi-card-js" style={{ padding: mobile ? '12px 12px' : '18px 20px', minWidth: 0, overflow: 'hidden' }}>
            <p className="kpi-label-js" style={{ color: '#9AAAB8', fontSize: mobile ? 10 : 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: mobile ? 6 : 5, lineHeight: 1.3 }}>{label}</p>
            <p className="kpi-number-js" style={{ color, fontSize: mobile ? 18 : 24, fontWeight: 800, lineHeight: 1.1, marginBottom: 3 }}>{value}</p>
            <p className="kpi-sub-js" style={{ color: '#9AAAB8', fontSize: mobile ? 10 : 12 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Gráfico comparativo */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: mobile ? '14px' : '22px' }}>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Comparativo mensal</p>
          <p style={{ color: '#9AAAB8', fontSize: 11, marginBottom: 14 }}>Alcance Instagram vs Oliver</p>
          <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 160 : 240}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
              <XAxis dataKey="mes" tick={{ fill: '#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9AAAB8', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '' : fmt(v)} width={mobile ? 34 : 48} />
              <Tooltip
                formatter={(v, name) => [name === 'alcance_oliver' ? fmtExato(v) : fmt(v), name === 'alcance_insta' ? 'Instagram' : 'Oliver']}
                labelFormatter={(_, p) => p?.[0]?.payload?.mesFull || ''}
                contentStyle={{ borderRadius: 10, border: '1px solid #EAECF0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              />
              <Legend formatter={v => v === 'alcance_insta' ? 'Instagram' : 'Oliver'} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="alcance_insta"  name="alcance_insta"  radius={[4,4,0,0]} barSize={mobile ? 10 : 20} fill="#1C252E" />
              <Bar dataKey="alcance_oliver" name="alcance_oliver" radius={[4,4,0,0]} barSize={mobile ? 10 : 20} fill="#F97316" />
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      )}

      {/* Tabela mensal */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px' }}>
          <p style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Dados mês a mês</p>
          <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 2 }}>
            Clique no lápis para inserir os dados da Oliver
          </p>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {(mobile
                  ? ['Mês','Instagram','Oliver','']
                  : ['Mês','Posts','Alcance Instagram','Alcance Oliver','Diferença','']
                ).map(h => (
                  <th key={h} style={{ padding: mobile ? '8px 12px' : '10px 16px', color: '#8A9BB0', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => {
                const isEditing = editingMes === m.chave
                const diff      = m.alcance_oliver && m.alcance_insta
                  ? pctDiff(m.alcance_oliver, m.alcance_insta) : null
                const diffColor = diff == null ? '#9AAAB8' : Number(diff) > 0 ? '#16a34a' : '#ef4444'
                const hasData   = m.alcance_insta > 0 || m.alcance_oliver

                return (
                  <tr key={m.chave}
                    style={{ borderTop: '1px solid #F5F7FA', opacity: hasData ? 1 : 0.45 }}>
                    <td style={{ padding: mobile ? '10px 12px' : '13px 16px', color: '#1C252E', fontSize: mobile ? 12 : 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {mobile ? m.mes : m.mesFull}
                    </td>
                    {!mobile && (
                      <td style={{ padding: '13px 16px', color: '#9AAAB8', fontSize: 12 }}>
                        {m.nPosts > 0 ? `${m.nPosts} posts` : '—'}
                      </td>
                    )}
                    <td style={{ padding: mobile ? '10px 12px' : '13px 16px', color: '#1C252E', fontSize: mobile ? 12 : 13, fontWeight: 600 }}>
                      {m.alcance_insta > 0 ? fmt(m.alcance_insta) : '—'}
                    </td>
                    <td style={{ padding: mobile ? '10px 12px' : '13px 16px' }}>
                      {isEditing ? (
                        <input type="number" value={inputVal.alcance_oliver}
                          onChange={e => setInputVal(v => ({ ...v, alcance_oliver: e.target.value }))}
                          placeholder="ex: 185000"
                          style={{ width: mobile ? 90 : 120, border: '1.5px solid #C3EBF7', borderRadius: 8,
                            padding: '5px 9px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                          autoFocus />
                      ) : (
                        <span style={{ color: '#F97316', fontSize: mobile ? 12 : 13, fontWeight: 600 }}>
                          {fmt(m.alcance_oliver)}
                        </span>
                      )}
                    </td>
                    {!mobile && (
                      <td style={{ padding: '13px 16px' }}>
                        {diff != null ? (
                          <span style={{
                            color: diffColor, fontSize: 12, fontWeight: 700,
                            background: Number(diff) > 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
                            borderRadius: 6, padding: '2px 8px',
                          }}>
                            {Number(diff) > 0 ? '+' : ''}{diff}%
                          </span>
                        ) : <span style={{ color: '#D0D8E0', fontSize: 12 }}>—</span>}
                      </td>
                    )}
                    <td style={{ padding: mobile ? '10px 8px' : '13px 16px' }}>
                      {isEditing ? (
                        <button onClick={() => saveEdit(m.chave)}
                          style={{ background: '#1C252E', color: '#C3EBF7', border: 'none',
                            borderRadius: 8, padding: mobile ? '5px 8px' : '6px 12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <Check size={13} /> {!mobile && 'Salvar'}
                        </button>
                      ) : (
                        <button onClick={() => startEdit(m.chave, m)}
                          style={{ background: '#F4F6F8', border: 'none', borderRadius: 8,
                            padding: mobile ? '5px 8px' : '6px 10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, color: '#8A9BB0', fontSize: 12 }}>
                          <Edit2 size={12} /> {!mobile && 'Editar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
