import { useState } from 'react'
import { useStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Edit2, Check } from 'lucide-react'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',')+'K'
  return Number(n).toLocaleString('pt-BR')
}

function pctDiff(a, b) {
  if (!a || !b) return null
  return ((a - b) / b * 100).toFixed(1)
}

export default function OliverView() {
  const { posts, mesFiltro, oliverData, setOliverData } = useStore()
  const ano = mesFiltro?.split('/')?.[1] || '2026'

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
        <h2 style={{ color: '#1C252E', fontSize: 20, fontWeight: 800 }}>Acompanhamento Oliver</h2>
        <p style={{ color: '#9AAAB8', fontSize: 13, marginTop: 3 }}>
          Comparativo mensal entre os dados da agência Oliver e o Instagram · {ano}
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { label: 'Total Instagram (ano)', value: fmt(totalInsta),  color: '#1C252E', bg: 'rgba(28,37,46,0.06)',      desc: 'Soma das contas alcançadas via Instagram' },
          { label: 'Total Oliver (ano)',    value: fmt(totalOliver || null), color: '#FF6200', bg: 'rgba(255,98,0,0.08)', desc: 'Soma dos dados da agência' },
          { label: 'Diferença acumulada',  value: diff ? `${diff > 0 ? '+' : ''}${diff}%` : '—',
            color: diff == null ? '#9AAAB8' : diff > 0 ? '#16a34a' : '#ef4444',
            bg: diff == null ? '#F4F6F8' : diff > 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
            desc: 'Oliver vs Instagram (+ = Oliver maior)' },
          { label: 'Meses preenchidos',    value: String(meses.filter(m => m.alcance_oliver).length) + ' / 12',
            color: '#0891B2', bg: 'rgba(8,145,178,0.08)', desc: 'Meses com dado Oliver inserido' },
        ].map(({ label, value, color, bg, desc }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ color: '#9AAAB8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</p>
            <p style={{ color, fontSize: 24, fontWeight: 800, lineHeight: 1.1, marginBottom: 3 }}>{value}</p>
            <p style={{ color: '#9AAAB8', fontSize: 12 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Gráfico comparativo */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: '22px' }}>
          <p style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Comparativo mensal</p>
          <p style={{ color: '#9AAAB8', fontSize: 12, marginBottom: 20 }}>Alcance Instagram vs dados Oliver</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
              <XAxis dataKey="mes" tick={{ fill: '#9AAAB8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9AAAB8', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '' : fmt(v)} width={48} />
              <Tooltip
                formatter={(v, name) => [fmt(v), name === 'alcance_insta' ? 'Instagram' : 'Oliver']}
                labelFormatter={(_, p) => p?.[0]?.payload?.mesFull || ''}
                contentStyle={{ borderRadius: 10, border: '1px solid #EAECF0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              />
              <Legend formatter={v => v === 'alcance_insta' ? 'Instagram' : 'Oliver'} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="alcance_insta"  name="alcance_insta"  radius={[6,6,0,0]} barSize={20} fill="#1C252E" />
              <Bar dataKey="alcance_oliver" name="alcance_oliver" radius={[6,6,0,0]} barSize={20} fill="#FF6200" />
            </BarChart>
          </ResponsiveContainer>
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

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC' }}>
                {['Mês','Posts','Alcance Instagram','Alcance Oliver','Meta Oliver','Diferença',''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', color: '#8A9BB0', fontSize: 11, fontWeight: 600,
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
                    <td style={{ padding: '13px 16px', color: '#1C252E', fontSize: 13, fontWeight: 600 }}>
                      {m.mesFull}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#9AAAB8', fontSize: 12 }}>
                      {m.nPosts > 0 ? `${m.nPosts} posts` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#1C252E', fontSize: 13, fontWeight: 600 }}>
                      {m.alcance_insta > 0 ? fmt(m.alcance_insta) : '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {isEditing ? (
                        <input type="number" value={inputVal.alcance_oliver}
                          onChange={e => setInputVal(v => ({ ...v, alcance_oliver: e.target.value }))}
                          placeholder="ex: 185000"
                          style={{ width: 110, border: '1.5px solid #C3EBF7', borderRadius: 8,
                            padding: '5px 9px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                          autoFocus />
                      ) : (
                        <span style={{ color: '#FF6200', fontSize: 13, fontWeight: 600 }}>
                          {fmt(m.alcance_oliver)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {isEditing ? (
                        <input type="number" value={inputVal.meta_oliver}
                          onChange={e => setInputVal(v => ({ ...v, meta_oliver: e.target.value }))}
                          placeholder="ex: 180000"
                          style={{ width: 110, border: '1.5px solid #E8ECF0', borderRadius: 8,
                            padding: '5px 9px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                        />
                      ) : (
                        <span style={{ color: '#9AAAB8', fontSize: 13 }}>
                          {fmt(m.meta_oliver)}
                        </span>
                      )}
                    </td>
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
                    <td style={{ padding: '13px 16px' }}>
                      {isEditing ? (
                        <button onClick={() => saveEdit(m.chave)}
                          style={{ background: '#1C252E', color: '#C3EBF7', border: 'none',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Check size={13} /> Salvar
                        </button>
                      ) : (
                        <button onClick={() => startEdit(m.chave, m)}
                          style={{ background: '#F4F6F8', border: 'none', borderRadius: 8,
                            padding: '6px 10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5, color: '#8A9BB0', fontSize: 12 }}>
                          <Edit2 size={12} /> Editar
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
