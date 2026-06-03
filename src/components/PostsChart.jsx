import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell
} from 'recharts'
import { useStore } from '../store/useStore'
import { temasLabel } from '../utils/temas'
import { useIsMobile } from '../utils/useIsMobile'

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n
}

const COLOR = { Carrossel: '#FF6200', Reels: '#1C252E', 'Foto estática': '#C3EBF7' }
const BORDER_COLOR = { 'Foto estática': '#3a7a96' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#fff', border: '1px solid #E8ECF0', borderRadius: 14,
      padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontSize: 13, minWidth: 200
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: COLOR[d.tipo] || '#ccc', flexShrink: 0 }} />
        <p style={{ fontWeight: 600, color: '#1C252E', margin: 0, fontSize: 13 }}>{temasLabel(d) || d.nome || '—'}</p>
      </div>
      <p style={{ color: '#8A9BB0', margin: '0 0 6px', fontSize: 12 }}>{d.data_post} · {d.tipo}</p>
      <p style={{ color: '#FF6200', fontWeight: 700, fontSize: 18, margin: 0 }}>
        {(d.contas_alcancadas || 0).toLocaleString('pt-BR')}
        <span style={{ color: '#8A9BB0', fontSize: 12, fontWeight: 400 }}> contas</span>
      </p>
      {d.status === 'parcial' && (
        <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 6, margin: '6px 0 0' }}>🕐 Dados ainda parciais</p>
      )}
    </div>
  )
}

export default function PostsChart() {
  const { getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  const data = [...posts].sort((a, b) => {
    const parse = (s) => { const [d,m,y] = (s||'').split('/'); return new Date(`${y}-${m}-${d}`) }
    return parse(a.data_post) - parse(b.data_post)
  }).map(p => ({ ...p, label: p.data_post?.slice(0, 5) || '—' }))

  const mobile = useIsMobile()
  const media = data.length > 0
    ? Math.round(data.reduce((s, p) => s + (p.contas_alcancadas || 0), 0) / data.length)
    : 0

  return (
    <div className="card" style={{ padding: mobile ? '14px 14px' : '20px 22px', marginBottom: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700, margin:0 }}>Alcance por post</h2>
          {/* Legenda compacta */}
          <div style={{ display:'flex', alignItems:'center', gap: mobile ? 8 : 14, flexWrap:'wrap' }}>
            {Object.entries(COLOR).map(([tipo, cor]) => (
              <div key={tipo} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:cor, border: BORDER_COLOR[tipo] ? `1.5px solid ${BORDER_COLOR[tipo]}` : 'none', flexShrink:0 }} />
                <span style={{ color:'#8A9BB0', fontSize: mobile ? 10 : 12, whiteSpace:'nowrap' }}>
                  {mobile ? tipo.replace(' estática','') : tipo}
                </span>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:14, borderTop:'2px dashed #8A9BB0' }} />
              <span style={{ color:'#8A9BB0', fontSize: mobile ? 10 : 12 }}>Média</span>
            </div>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#8A9BB0', fontSize: 14 }}>Nenhum post no período</p>
        </div>
      ) : (
        <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 160 : 220}>
          <BarChart data={data} margin={{ top: 4, right: mobile ? 4 : 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: mobile ? 9 : 11, fill: '#8A9BB0' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: mobile ? 9 : 11, fill: '#8A9BB0' }} axisLine={false} tickLine={false} width={mobile ? 32 : 44} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }} />
            {media > 0 && (
              <ReferenceLine y={media} stroke="#8A9BB0" strokeDasharray="5 3" strokeWidth={1.5}
                label={mobile ? undefined : { value: `${fmt(media)}`, position: 'right', fill: '#8A9BB0', fontSize: 11 }} />
            )}
            <Bar dataKey="contas_alcancadas" radius={[4, 4, 0, 0]} maxBarSize={mobile ? 28 : 44}>
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={COLOR[entry.tipo] || '#C3EBF7'}
                  opacity={entry.status === 'parcial' ? 0.5 : 1}
                  stroke={entry.tipo === 'Foto estática' ? '#3a7a96' : 'none'}
                  strokeWidth={entry.tipo === 'Foto estática' ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer></div>
      )}
    </div>
  )
}
