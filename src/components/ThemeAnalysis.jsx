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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {temas.slice(0, 6).map(({ tema, media, count }, i) => {
          const isLider = i === 0
          const barPct = max > 0 ? (media / max) * 100 : 0
          return (
            <div key={tema}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isLider && <span style={{ fontSize: 13 }}>🏆</span>}
                  <span style={{ color: '#1C252E', fontSize: 13, fontWeight: isLider ? 600 : 400 }}>{tema}</span>
                  <span style={{ color: '#8A9BB0', fontSize: 11 }}>({count})</span>
                </div>
                <span style={{ color: isLider ? '#FF6200' : '#1C252E', fontWeight: isLider ? 700 : 500, fontSize: 13 }}>
                  {fmt(media)}
                </span>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${barPct}%`, height: '100%',
                  background: isLider ? '#FF6200' : '#C3EBF7',
                  borderRadius: 999, transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
