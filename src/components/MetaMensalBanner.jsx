import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'
import { calcMetaMesProgressiva } from '../utils/metaCalc'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',') + 'K'
  return n.toLocaleString('pt-BR')
}

export default function MetaMensalBanner() {
  const mobile = useIsMobile()
  if (!mobile) return null

  const { getPostsDoMes, posts: allPosts, metaAnual, mesFiltro } = useStore()
  const posts = getPostsDoMes()
  const total = posts.reduce((s, p) => s + (p.contas_alcancadas || 0), 0)

  const [mm, yyyy] = (mesFiltro || '').split('/')
  const meta = calcMetaMesProgressiva({ posts: allPosts, metaAnual, mm, yyyy })
  const pct  = meta > 0 ? Math.min((total / meta) * 100, 100) : 0
  const mesNome = MESES_NOMES[(parseInt(mm, 10) || 1) - 1]

  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Meta · {mesNome}
        </p>
        <p style={{ color: pct >= 100 ? '#16a34a' : '#F97316', fontSize: 13, fontWeight: 800 }}>
          {pct.toFixed(0)}%
        </p>
      </div>
      <div style={{ background: '#F0F2F5', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%', borderRadius: 6,
          background: pct >= 100 ? '#16a34a' : '#F97316',
          width: `${pct}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#F97316', fontSize: 13, fontWeight: 700 }}>{fmt(total)}</span>
        <span style={{ color: '#9AAAB8', fontSize: 11 }}>de {fmt(meta)}</span>
      </div>
    </div>
  )
}
