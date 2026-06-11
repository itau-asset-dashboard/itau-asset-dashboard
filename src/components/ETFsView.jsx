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

const TIPO_COLOR = { Carrossel:'#F97316', Reels:'#1C252E', 'Foto estática':'#0EA5E9' }
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
    .slice(0, 8)
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
      mes:     MESES_LABEL[i],
      mesFull: MESES_FULL[i],
      alcance: mp.reduce((s,p) => s+(p.contas_alcancadas||0), 0),
      posts:   mp.length,
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
  const KPIS = [
    { label:'Total alcançado',  value:fmt(totalEtf),  sub:`${participacao.toFixed(1)}% do total${viewMode==='mensal'?' do mês':' do ano'}`, color:'#F97316', bg:'rgba(249,115,22,0.08)' },
    { label:'Média por post',   value:fmt(mediaEtf),  sub:'contas / publicação',                                                             color:'#0891B2', bg:'rgba(8,145,178,0.08)' },
    { label:'Melhor post',      value:fmt(melhor?.contas_alcancadas), sub:(melhor?.nome||'—').slice(0,22),                                   color:'#7C3AED', bg:'rgba(124,58,237,0.08)' },
    { label:'Posts ETF',        value:String(etfPosts.length),        sub:`de ${basePosts.length} posts${viewMode==='mensal'?' no mês':' no ano'}`, color:'#059669', bg:'rgba(5,150,105,0.08)' },
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
            <h2 style={{ color:'#1C252E', fontSize:20, fontWeight:800 }}>ETFs</h2>
            <p style={{ color:'#9AAAB8', fontSize:13, marginTop:3 }}>
              Performance do tema ETFs · {periodoLabel}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Toggle Anual / Mensal */}
            <div style={{
              display:'flex', background:'rgba(28,37,46,0.06)', borderRadius:12,
              padding:3, gap:2,
            }}>
              {['anual','mensal'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding:'6px 16px', borderRadius:10, border:'none', cursor:'pointer',
                    fontSize:13, fontWeight: viewMode===mode ? 700 : 400,
                    background: viewMode===mode ? '#1C252E' : 'transparent',
                    color: viewMode===mode ? '#C3EBF7' : '#5A7080',
                    transition:'all 0.15s',
                  }}>
                  {mode === 'anual' ? 'Anual' : 'Mensal'}
                </button>
              ))}
            </div>

            {/* Pill participação */}
            <div style={{ background:'rgba(8,145,178,0.08)', borderRadius:10, padding:'6px 12px', textAlign:'center', border:'1px solid rgba(8,145,178,0.12)' }}>
              <p style={{ color:'#0891B2', fontSize:15, fontWeight:800, lineHeight:1 }}>{participacao.toFixed(1)}%</p>
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
            background:'rgba(8,145,178,0.05)',
            borderRadius:14,
            padding:6,
          }}>
            {MESES_LABEL.map((m, i) => (
              <button key={i} onClick={() => setMesSel(i)}
                style={{
                  padding:'7px 4px', borderRadius:10, border:'none', cursor:'pointer',
                  fontSize:12, fontWeight: mesSel===i ? 700 : 500,
                  background: mesSel===i ? '#0891B2' : 'transparent',
                  color: mesSel===i ? '#fff' : '#0891B2',
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
        {KPIS.map(({label,value,sub,color,bg}) => (
          <div key={label} className="card" style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#9AAAB8', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>{label}</p>
              <p style={{ color:'#1C252E', fontSize:24, fontWeight:800, lineHeight:1.1, marginBottom:3 }}>{value}</p>
              <p style={{ color:'#9AAAB8', fontSize:12 }}>{sub}</p>
            </div>
            <div style={{ width:42, height:42, borderRadius:12, background:bg, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:16, height:16, borderRadius:4, background:color, opacity:0.8 }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico — anual mostra barras mensais; mensal mostra barras por formato */}
      {viewMode === 'anual' ? (
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>Evolução mensal</p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:20 }}>Alcance e volume de posts ETF por mês em {ano}</p>
          <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 160 : 240}>
            <BarChart data={byMonth} margin={{top:16, right: mobile ? 4 : 8, left:0, bottom:0}} barGap={4}>
              <XAxis dataKey="mes" tick={{ fill:'#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left" tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v=>v===0?'':fmt(v)} width={mobile ? 34 : 44}/>
              {!mobile && (
                <YAxis yAxisId="right" orientation="right" tick={{ fill:'#9AAAB8', fontSize:10 }}
                  axisLine={false} tickLine={false} width={24}
                  tickFormatter={v=>v===0?'':v} allowDecimals={false}/>
              )}
              <Tooltip
                formatter={(v,name) => name==='alcance' ? [fmt(v),'Alcance'] : [v,'Nº de posts']}
                labelFormatter={(_,p) => p?.[0]?.payload?.mesFull || ''}
                contentStyle={{ borderRadius:10, border:'1px solid #EAECF0', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}
              />
              {!mobile && <Legend formatter={v => v==='alcance'?'Alcance':'Nº de posts'} wrapperStyle={{ fontSize:12, color:'#9AAAB8' }}/>}
              <Bar yAxisId="left" dataKey="alcance" radius={[6,6,0,0]} barSize={mobile ? 16 : 22}>
                {byMonth.map((e,i) => (
                  <Cell key={i} fill={e.alcance>0?'#0891B2':'#F0F2F5'}/>
                ))}
              </Bar>
              {!mobile && <Bar yAxisId="right" dataKey="posts" radius={[6,6,0,0]} fill="rgba(8,145,178,0.18)" barSize={14}/>}
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      ) : (
        /* Modo mensal: gráfico de barras por formato */
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>Alcance por formato</p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:20 }}>Posts ETF em {MESES_FULL[mesSel]} {ano}</p>
          {porTipo.every(t => t.total === 0) ? (
            <p style={{ color:'#9AAAB8', fontSize:13, textAlign:'center', padding:'40px 0' }}>
              Nenhum post ETF neste mês
            </p>
          ) : (
            <div className="chart-wrapper"><ResponsiveContainer width="100%" height={200}>
              <BarChart data={porTipo} margin={{top:8,right:8,left:0,bottom:0}}>
                <XAxis dataKey="tipo" tick={{ fill:'#9AAAB8', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v=>v===0?'':fmt(v)} width={44}/>
                <Tooltip
                  formatter={(v,_,props) => [fmt(v), `${props.payload.count} posts`]}
                  contentStyle={{ borderRadius:10, border:'1px solid #EAECF0', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="total" radius={[8,8,0,0]} barSize={48}>
                  {porTipo.map((t,i) => (
                    <Cell key={i} fill={TIPO_COLOR[t.tipo]||'#0EA5E9'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </div>
      )}

      {/* Top posts + Performance por formato */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }} className="annual-grid">

        {/* Top posts */}
        <div className="card" style={{ padding:'22px' }}>
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
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>Por formato</p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:18 }}>Dentro do tema ETFs</p>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {porTipo.map((t,i) => (
              <div key={t.tipo}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:9, height:9, borderRadius:3,
                      background: TIPO_COLOR[t.tipo] || '#0EA5E9' }}/>
                    <span style={{ color:'#1C252E', fontSize:13, fontWeight:500 }}>{t.tipo}</span>
                    {i===0 && t.total>0 && (
                      <span style={{ background:'rgba(249,115,22,0.1)', color:'#F97316',
                        borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:700 }}>Líder</span>
                    )}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ color:'#1C252E', fontSize:13, fontWeight:700 }}>{fmt(t.total)}</span>
                    <span style={{ color:'#9AAAB8', fontSize:11, marginLeft:5 }}>{t.count} posts</span>
                  </div>
                </div>
                <div style={{ background:'#F0F2F5', borderRadius:4, height:6, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ height:'100%', borderRadius:4,
                    background: TIPO_COLOR[t.tipo]||'#0EA5E9',
                    width:`${maxTipo>0?(t.total/maxTipo)*100:0}%`, transition:'width 0.5s' }}/>
                </div>
                <p style={{ color:'#9AAAB8', fontSize:11 }}>
                  Média: {fmt(t.media)} · {pct(t.total, totalEtf)} do total ETF
                </p>
              </div>
            ))}
          </div>

          {/* Comparação vs outros temas */}
          <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #F0F4F8' }}>
            <p style={{ color:'#1C252E', fontSize:13, fontWeight:700, marginBottom:14 }}>ETFs vs outros temas</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {temaRank.slice(0,5).map(([tema,val]) => {
                const isEtf = ETF_TEMAS.includes(tema)
                return (
                  <div key={tema}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color: isEtf?'#0891B2':'#1C252E', fontSize:12,
                        fontWeight: isEtf?700:400 }}>{tema}</span>
                      <span style={{ color:'#9AAAB8', fontSize:11 }}>{fmt(val)}</span>
                    </div>
                    <div style={{ background:'#F0F2F5', borderRadius:3, height:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3,
                        background: isEtf?'#0891B2':'#D0D8E0',
                        width:`${(val/maxTema)*100}%`, transition:'width 0.5s' }}/>
                    </div>
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
