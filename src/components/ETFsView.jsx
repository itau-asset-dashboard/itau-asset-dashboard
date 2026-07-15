import { useState } from 'react'
import { useIsMobile } from '../utils/useIsMobile'
import { useStore } from '../store/useStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import UploadModal from './UploadModal'
import { hasAnyTheme, getTemas } from '../utils/temas'
import { PostRankRow } from './PostRankRow'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}


function pct(a, b) {
  if (!b) return '0%'
  return ((a/b)*100).toFixed(1)+'%'
}

const TIPO_COLOR = { Carrossel:'#FF8040', Reels:'#8A9BB0', 'Foto estática':'#C3EBF7' }
const ETF_TEMAS  = ['ETFs']

export default function ETFsView() {
  const { posts: allPosts, mesFiltro, updatePost, deletePost } = useStore()
  const mobile = useIsMobile()
  const ano = mesFiltro?.split('/')?.[1] || '2026'

  // ── view mode ──────────────────────────────────────
  const [viewMode, setViewMode]   = useState('anual')   // 'anual' | 'mensal'
  const [mesSel, setMesSel]       = useState(() => {
    // default: mês atual do filtro global
    const m = mesFiltro?.split('/')?.[0]
    return m ? parseInt(m, 10) - 1 : new Date().getMonth()
  })
  const [editTarget, setEditTarget] = useState(null)

  // ── base: todos os posts do ano com tema ETF ───────
  const postsAno   = allPosts.filter(p => p.data_post?.split('/')?.[2] === ano)
  const etfAno     = postsAno.filter(p => hasAnyTheme(p, ETF_TEMAS))

  // ── posts do período selecionado ───────────────────
  const etfPosts = viewMode === 'anual'
    ? etfAno
    : etfAno.filter(p => {
        const mm = p.data_post?.split('/')?.[1]
        return mm === String(mesSel + 1).padStart(2, '0')
      })

  const basePosts = viewMode === 'anual' ? postsAno
    : postsAno.filter(p => {
        const mm = p.data_post?.split('/')?.[1]
        return mm === String(mesSel + 1).padStart(2, '0')
      })

  // ── KPIs ───────────────────────────────────────────
  const totalEtf   = etfPosts.reduce((s,p) => s+(p.contas_alcancadas||0), 0)
  const totalGeral = basePosts.reduce((s,p) => s+(p.contas_alcancadas||0), 0)
  const mediaEtf   = etfPosts.length > 0 ? Math.round(totalEtf/etfPosts.length) : 0
  const melhor     = etfPosts.length > 0
    ? etfPosts.reduce((a,b) => (a.contas_alcancadas||0)>(b.contas_alcancadas||0)?a:b)
    : null
  const participacao = totalGeral > 0 ? (totalEtf/totalGeral)*100 : 0

  // ── Top posts ──────────────────────────────────────
  const topPosts = [...etfPosts]
    .sort((a,b) => (b.contas_alcancadas||0)-(a.contas_alcancadas||0))
    .slice(0, 5)
  const maxAlc = topPosts[0]?.contas_alcancadas || 1

  // ── Por formato ────────────────────────────────────
  const tipos  = ['Reels','Carrossel','Foto estática']
  const porTipo = tipos.map(t => {
    const tp = etfPosts.filter(p => p.tipo === t)
    return {
      tipo: t,
      total: tp.reduce((s,p) => s+(p.contas_alcancadas||0), 0),
      count: tp.length,
      media: tp.length > 0 ? Math.round(tp.reduce((s,p) => s+(p.contas_alcancadas||0),0)/tp.length) : 0,
    }
  }).sort((a,b) => b.total-a.total)
  const maxTipo = Math.max(...porTipo.map(t=>t.total), 1)

  // ── Evolução mensal (só no modo anual) ─────────────
  const byMonth = Array.from({length:12}, (_,i) => {
    const mm = String(i+1).padStart(2,'0')
    const mp = etfAno.filter(p => {
      const pts = p.data_post?.split('/')
      return pts?.[1]===mm && pts?.[2]===ano
    })
    return {
      mes:        MESES_LABEL[i],
      mesFull:    MESES_FULL[i],
      alcance:    mp.reduce((s,p) => s+(p.contas_alcancadas||0), 0),
      posts:      mp.length,
      interacoes: mp.reduce((s,p) => s+(p.curtidas||0)+(p.comentarios||0)+(p.reposts||0)+(p.compartilhamentos||0)+(p.salvamentos||0), 0),
    }
  })

  // ── Comparação temas ───────────────────────────────
  const temaMap = {}
  basePosts.forEach(p => {
    getTemas(p).forEach(t => {
      temaMap[t] = (temaMap[t]||0) + (p.contas_alcancadas||0)
    })
  })
  const temaRank = Object.entries(temaMap).sort((a,b)=>b[1]-a[1])
  const maxTema  = temaRank[0]?.[1] || 1

  // ── KPI cards ──────────────────────────────────────
  const f = fmt
  const KPIS = [
    { label:'Total alcançado',  value:f(totalEtf),  sub:`${participacao.toFixed(1)}% do total${viewMode==='mensal'?' do mês':' do ano'}`, color:'#FF6200', bg:'rgba(255,98,0,0.08)' },
    { label:'Média por post',   value:f(mediaEtf),  sub:'contas / publicação',                                                             color:'#1C252E', bg:'rgba(195,235,247,0.25)' },
    { label:'Melhor post',      value:f(melhor?.contas_alcancadas), sub:(melhor?.nome||'—').slice(0,22),                                   color:'#FF6200', bg:'rgba(28,37,46,0.06)' },
    { label:'Posts ETF',        value:String(etfPosts.length),      sub:`de ${basePosts.length} posts${viewMode==='mensal'?' no mês':' no ano'}`, color:'#1C252E', bg:'rgba(28,37,46,0.06)' },
  ]

  // ── Render ─────────────────────────────────────────
  const periodoLabel = viewMode === 'anual'
    ? ano
    : `${MESES_FULL[mesSel]} ${ano}`

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

        {/* Linha 1: título + toggle + participação */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <h2 style={{ color:'#1C252E', fontSize: mobile ? 17 : 20, fontWeight:800 }}>ETFs</h2>
            <p style={{ color:'#9AAAB8', fontSize: mobile ? 12 : 13, marginTop:3 }}>
              Performance do tema ETFs · {periodoLabel}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* Toggle Anual / Mensal */}
            <div style={{
              display:'flex', background:'rgba(28,37,46,0.06)', borderRadius:12,
              padding:3, gap:2,
            }}>
              {['anual','mensal'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding: mobile ? '5px 12px' : '6px 16px', borderRadius:10, border:'none', cursor:'pointer',
                    fontSize: mobile ? 12 : 13, fontWeight: viewMode===mode ? 700 : 400,
                    background: viewMode===mode ? '#1C252E' : 'transparent',
                    color: viewMode===mode ? '#C3EBF7' : '#5A7080',
                    transition:'all 0.15s',
                  }}>
                  {mode === 'anual' ? 'Anual' : 'Mensal'}
                </button>
              ))}
            </div>

            {/* Pill participação */}
            <div style={{ background:'rgba(195,235,247,0.25)', borderRadius:10, padding: mobile ? '5px 10px' : '6px 12px', textAlign:'center', border:'1px solid rgba(195,235,247,0.35)' }}>
              <p style={{ color:'#1C252E', fontSize: mobile ? 13 : 15, fontWeight:800, lineHeight:1 }}>{participacao.toFixed(1)}%</p>
              <p style={{ color:'#9AAAB8', fontSize:10, marginTop:2, whiteSpace:'nowrap' }}>do alcance total</p>
            </div>
          </div>
        </div>

        {/* Linha 2: seletor de mês full-width (só no modo mensal) */}
        {viewMode === 'mensal' && (
          <div className="etf-month-grid" style={{
            display:'grid',
            gridTemplateColumns:'repeat(12, 1fr)',
            gap:6,
            background:'rgba(195,235,247,0.15)',
            borderRadius:14,
            padding:6,
          }}>
            {MESES_LABEL.map((m, i) => (
              <button key={i} onClick={() => setMesSel(i)}
                style={{
                  padding:'7px 4px', borderRadius:10, border:'none', cursor:'pointer',
                  fontSize:12, fontWeight: mesSel===i ? 700 : 500,
                  background: mesSel===i ? '#1C252E' : 'transparent',
                  color: mesSel===i ? '#fff' : '#1C252E',
                  transition:'all 0.15s',
                  textAlign:'center',
                }}>
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {KPIS.map(({label,value,sub}) => (
          <div key={label} className="card" style={{ padding: mobile ? '12px 14px' : '18px 20px' }}>
            <p style={{ color:'#9AAAB8', fontSize: mobile ? 9 : 11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom: mobile ? 4 : 5 }}>{label}</p>
            <p style={{ color:'#1C252E', fontSize: mobile ? 18 : 24, fontWeight:800, lineHeight:1.1, marginBottom: mobile ? 2 : 3 }}>{value}</p>
            <p style={{ color:'#9AAAB8', fontSize: mobile ? 10 : 12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico — anual mostra barras mensais; mensal mostra barras por formato */}
      {viewMode === 'anual' ? (
        <>
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 8 : 12 }}>
          <div className="card" style={{ padding: mobile ? '14px' : '20px' }}>
            <p style={{ color:'#1C252E', fontSize:13, fontWeight:700, marginBottom:16 }}>Alcance por mês</p>
            <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 140 : 180}>
              <BarChart data={byMonth} margin={{top:4, right:4, left:0, bottom:0}}>
                <XAxis dataKey="mes" tick={{ fill:'#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v=>v===0?'':fmt(v)} width={mobile ? 34 : 44}/>
                <Tooltip
                  formatter={v => [fmt(v),'Alcance']}
                  labelFormatter={(_,p) => p?.[0]?.payload?.mesFull || ''}
                  contentStyle={{ borderRadius:10, border:'1px solid #EAECF0', fontSize:12 }}
                />
                <Bar dataKey="alcance" radius={[6,6,0,0]} barSize={mobile ? 16 : 22}>
                  {byMonth.map((e,i) => <Cell key={i} fill={e.alcance>0?'#1C252E':'#F0F2F5'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
          </div>

          <div className="card" style={{ padding: mobile ? '14px' : '20px' }}>
            <p style={{ color:'#1C252E', fontSize:13, fontWeight:700, marginBottom:16 }}>Interações por mês</p>
            <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 140 : 180}>
              <BarChart data={byMonth} margin={{top:4, right:4, left:0, bottom:0}}>
                <XAxis dataKey="mes" tick={{ fill:'#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v=>v===0?'':fmt(v)} width={mobile ? 34 : 44}/>
                <Tooltip
                  formatter={v => [fmt(v),'Interações']}
                  labelFormatter={(_,p) => p?.[0]?.payload?.mesFull || ''}
                  contentStyle={{ borderRadius:10, border:'1px solid #EAECF0', fontSize:12 }}
                />
                <Bar dataKey="interacoes" radius={[6,6,0,0]} barSize={mobile ? 16 : 22}>
                  {byMonth.map((e,i) => <Cell key={i} fill={e.interacoes>0?'#FF6200':'#F0F2F5'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
          </div>

        </div>
        </>
      ) : (
        /* Modo mensal: cards por formato */
        <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap:12 }}>
          {porTipo.map(t => (
            <div key={t.tipo} className="card" style={{ padding: mobile ? '14px 16px' : '18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:10, height:10, borderRadius:3, background: TIPO_COLOR[t.tipo]||'#C3EBF7', flexShrink:0 }}/>
                <span style={{ color:'#9AAAB8', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{t.tipo}</span>
              </div>
              <p style={{ color:'#1C252E', fontSize: mobile ? 22 : 26, fontWeight:800, lineHeight:1, marginBottom:4 }}>
                {t.total > 0 ? fmt(t.total) : '—'}
              </p>
              <p style={{ color:'#9AAAB8', fontSize:11, marginBottom:10 }}>
                {t.count} post{t.count !== 1 ? 's' : ''} · média {fmt(t.media)}
              </p>
              <div style={{ background:'#F0F2F5', borderRadius:6, height:4, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:6,
                  background: t.total > 0 ? (TIPO_COLOR[t.tipo]||'#C3EBF7') : 'transparent',
                  width:`${maxTipo > 0 ? (t.total/maxTipo)*100 : 0}%`,
                  transition:'width 0.6s'
                }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top posts + Performance por formato */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap:16 }} className="annual-grid">

        {/* Top posts */}
        <div className="card" style={{ padding: mobile ? '14px' : '22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>
            Top posts ETF {viewMode === 'mensal' ? `· ${MESES_LABEL[mesSel]}` : ''}
          </p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:18 }}>Clique para editar</p>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {topPosts.length === 0 && (
              <p style={{ color:'#9AAAB8', fontSize:13, textAlign:'center', padding:'32px 0' }}>
                Nenhum post ETF encontrado
              </p>
            )}
            {topPosts.map((p, i) => (
              <PostRankRow
                key={p.id}
                post={p}
                i={i}
                maxVal={maxAlc}
                onClick={() => setEditTarget(p)}
              />
            ))}
          </div>
        </div>

        {/* Performance por formato + comparação temas */}
        <div className="card" style={{ padding: mobile ? '14px' : '22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>Por formato</p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:18 }}>Dentro do tema ETFs</p>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {porTipo.map((t,i) => (
              <div key={t.tipo} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < porTipo.length-1 ? '1px solid #F0F2F5' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background: TIPO_COLOR[t.tipo] || '#C3EBF7' }}/>
                  <span style={{ color:'#1C252E', fontSize: i===0?14:13, fontWeight:500 }}>{t.tipo}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ color: i===0?'#FF6200':'#1C252E', fontSize: i===0?15:13, fontWeight:500 }}>{fmt(t.total)}</span>
                  <span style={{ color:'#9AAAB8', fontSize:11, marginLeft:5 }}>{t.count} posts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comparação vs outros temas */}
          <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #F0F4F8' }}>
            <p style={{ color:'#1C252E', fontSize:13, fontWeight:700, marginBottom:14 }}>ETFs vs outros temas</p>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {temaRank.slice(0,5).map(([tema,val], i) => {
                const isEtf = ETF_TEMAS.includes(tema)
                return (
                  <div key={tema} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < 4 ? '1px solid #F0F2F5' : 'none' }}>
                    <span style={{ color:'#1C252E', fontSize: isEtf?14:12, fontWeight: isEtf?500:400 }}>{tema}</span>
                    <span style={{ color: isEtf?'#FF6200':'#1C252E', fontSize: isEtf?14:12, fontWeight:500 }}>{fmt(val)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {editTarget && (
        <UploadModal mode="update" post={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={dados => { updatePost(editTarget.id, dados); setEditTarget(null) }}
          onDelete={() => { deletePost(editTarget.id); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
