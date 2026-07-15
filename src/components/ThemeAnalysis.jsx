import { useStore } from '../store/useStore'
import { getTemas } from '../utils/temas'

function fmt(n) {
  if (!n) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'K'
  return n.toLocaleString('pt-BR')
}

export default function ThemeAnalysis() {
  const { getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  const temaMap = {}
  posts.forEach(p => {
    const ts = getTemas(p)
    const list = ts.length > 0 ? ts : ['Sem tema']
    list.forEach(t => {
      if (!temaMap[t]) temaMap[t] = { total: 0, count: 0 }
      temaMap[t].total += p.contas_alcancadas || 0
      temaMap[t].count++
    })
  })

  const temas = Object.entries(temaMap)
    .map(([tema, { total, count }]) => ({ tema, media: Math.round(total / count), count }))
    .sort((a, b) => b.media - a.media)

  if (temas.length < 3) return null

  const max = temas[0].media

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700, margin: 0 }}>Análise por tema</h2>
        <span style={{ color: '#8A9BB0', fontSize: 12 }}>{temas.length} temas distintos</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {temas.slice(0, 6).map(({ tema, media, count }, i) => (
          <div key={tema} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < Math.min(temas.length, 6) - 1 ? '1px solid #F0F2F5' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#1C252E', fontSize: i === 0 ? 14 : 13, fontWeight: 500 }}>{tema}</span>
              <span style={{ color: '#B0BEC5', fontSize: 11 }}>({count})</span>
            </div>
            <span style={{ color: i === 0 ? '#FF6200' : '#1C252E', fontWeight: 500, fontSize: i === 0 ? 15 : 13 }}>
              {fmt(media)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
