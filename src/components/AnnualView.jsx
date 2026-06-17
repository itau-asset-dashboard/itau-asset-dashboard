import { useStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { Users, TrendingUp, Award, LayoutGrid } from 'lucide-react'
import { getTemas } from '../utils/temas'
import { calcMetaMesAjustada, calcMetaMesProgressiva } from '../utils/metaCalc'
import { useIsMobile } from '../utils/useIsMobile'

const MESES_LABEL  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const TIPO_COLOR = { Carrossel:'#FF6200', Reels:'#1C252E', 'Foto estática':'#C3EBF7' }

export default function AnnualView() {
  const { getPostsDoAno, metaAnual, mesFiltro, posts: allPosts } = useStore()
  const mobile = useIsMobile()
  const ano   = mesFiltro?.split('/')?.[1] || '2026'
  const posts = getPostsDoAno(ano)

  const total   = posts.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const media   = posts.length > 0 ? Math.round(total/posts.length) : 0
  const melhor  = posts.length > 0 ? posts.reduce((a,b)=>(a.contas_alcancadas||0)>(b.contas_alcancadas||0)?a:b,posts[0]) : null
  const pct     = metaAnual > 0 ? Math.min((total/metaAnual)*100,100) : 0
  // Sempre usa o mês real de hoje — independente do filtro selecionado em outras abas
  const hoje = new Date()
  const mesHojeParam = `${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`
  const metaMesAtualizada = calcMetaMesAjustada({ posts: allPosts, metaAnual, mesFiltroParam: mesHojeParam })
  const restante  = Math.max(metaAnual - total, 0)

  // Dados mensais com meta ajustada por mês
  const byMonth = Array.from({length:12},(_,i)=>{
    const mm = String(i+1).padStart(2,'0')
    const mesVal = `${mm}/${ano}`
    const mPosts = posts.filter(p=>{
      const pts = p.data_post?.split('/')
      return pts?.[1]===mm && pts?.[2]===ano
    })
    const total = mPosts.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
    const metaMes = calcMetaMesProgressiva({ posts: allPosts, metaAnual, mm, yyyy: ano })
    const pctMes = metaMes > 0 && total > 0 ? Math.round((total / metaMes) * 100) : null
    return {
      mes:     MESES_LABEL[i],
      mesFull: MESES_FULL[i],
      total,
      count:   mPosts.length,
      meta:    metaMes,
      pctMes,
    }
  })

  // Por tipo
  const tipos   = ['Carrossel','Reels','Foto estática']
  const porTipo = tipos.map(t=>({
    tipo:  t,
    total: posts.filter(p=>p.tipo===t).reduce((s,p)=>s+(p.contas_alcancadas||0),0),
    count: posts.filter(p=>p.tipo===t).length,
  })).sort((a,b)=>b.total-a.total)
  const maxTipo = Math.max(...porTipo.map(t=>t.total),1)

  // Por tema
  const temaMap = {}
  posts.forEach(p=>{ getTemas(p).forEach(t=>{ temaMap[t]=(temaMap[t]||0)+(p.contas_alcancadas||0) }) })
  const porTema = Object.entries(temaMap).sort((a,b)=>b[1]-a[1]).slice(0,5)

  const CARDS = [
    {
      label: 'Total alcançado',
      value: fmt(total),
      sub: `${pct.toFixed(0)}% da meta anual`,
      icon: Users,
      color: '#FF6200',
      bg: 'rgba(255,98,0,0.08)',
      trend: pct >= 50 ? 'up' : 'neutral',
    },
    {
      label: 'Média por post',
      value: fmt(media),
      sub: 'contas / publicação',
      icon: TrendingUp,
      color: '#1C252E',
      bg: 'rgba(195,235,247,0.25)',
      trend: 'neutral',
    },
    {
      label: 'Melhor post',
      value: fmt(melhor?.contas_alcancadas),
      sub: (melhor?.nome || '—').slice(0,22),
      icon: Award,
      color: '#FF6200',
      bg: 'rgba(28,37,46,0.06)',
      trend: 'up',
    },
    {
      label: 'Posts cadastrados',
      value: String(posts.length),
      sub: `${posts.filter(p=>p.status==='parcial').length} parciais`,
      icon: LayoutGrid,
      color: '#1C252E',
      bg: 'rgba(28,37,46,0.06)',
      trend: 'neutral',
    },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── KPI Cards ── */}
      <style>{`@media(max-width:768px){.kpi-grid-js{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}.kpi-card-js{padding:10px!important}.kpi-label-js{font-size:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin-bottom:5px!important}.kpi-number-js{font-size:16px!important;margin-bottom:2px!important}.kpi-sub-js{font-size:8px!important}.kpi-icon-js{display:none!important}}@media(max-width:390px){.kpi-number-js{font-size:14px!important}}`}</style>
      <div className="kpi-grid-js" style={{
        display:'grid',
        gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
        gap: mobile ? 8 : 14,
        marginBottom: 14,
      }}>
        {CARDS.map(({label,value,sub,icon:Icon,color,bg},idx)=>{
          const mLabel = mobile
            ? ['Alcançado','Média/post','Melhor','Posts'][idx]
            : label
          return (
            <div key={label} className="card kpi-card kpi-card-js" style={{
              padding: mobile ? '12px 12px' : '18px 20px',
              borderTop: idx===0 ? `3px solid ${color}` : '3px solid transparent',
              position: 'relative',
              minWidth: 0,
              overflow: 'hidden',
            }}>
              <p className="kpi-label-js" style={{ color:'#8A9BB0', fontSize: mobile ? 10 : 11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom: mobile ? 8 : 14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mLabel}</p>
              <p className="kpi-number-js" style={{ color:'#182638', fontSize: mobile ? 20 : 28, fontWeight:800, lineHeight:1, letterSpacing:'-0.02em', marginBottom: mobile ? 4 : 6 }}>{value}</p>
              <p className="kpi-sub-js" style={{ color:'#A8B5C0', fontSize: mobile ? 10 : 12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</p>
              <div className="kpi-icon-js" style={{ position:'absolute', top:18, right:18, width:30, height:30, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={14} color={color} strokeWidth={2.1}/>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Progresso meta + gráfico ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }} className="annual-grid">

        {/* Card meta — só para 2026 */}
        <div className="card" style={{ padding:'22px' }}>
          {ano !== '2026' ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:8, padding:'20px 0' }}>
              <p style={{ color:'#9AAAB8', fontSize:13, textAlign:'center' }}>Metas definidas apenas para 2026</p>
              <p style={{ color:'#C3EBF7', fontSize:12, textAlign:'center' }}>Dados de {ano} são histórico de referência</p>
            </div>
          ) : (
            <>
              <p style={{ color:'#9AAAB8', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Meta anual {ano}</p>
              <p style={{ color:'#FF6200', fontSize:32, fontWeight:800, lineHeight:1, marginBottom:2 }}>{fmt(total)}</p>
              <p style={{ color:'#9AAAB8', fontSize:13, marginBottom:16 }}>de {fmt(metaAnual)}</p>
              <div style={{ background:'#F0F2F5', borderRadius:8, height:10, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', borderRadius:8, background:'#FF6200', width:`${pct}%`, transition:'width 0.6s ease', backgroundImage:'linear-gradient(90deg,#FF6200,#ff8533)' }}/>
              </div>
              <p style={{ color:'#1C252E', fontSize:22, fontWeight:800, marginBottom:2 }}>{pct.toFixed(1)}%</p>
              <p style={{ color:'#9AAAB8', fontSize:12 }}>atingido</p>
              <div style={{ marginTop:16, padding:'12px 14px', background:'#F8FAFC', borderRadius:10 }}>
                <p style={{ color:'#9AAAB8', fontSize:11, marginBottom:4 }}>Faltam para a meta</p>
                <p style={{ color:'#1C252E', fontSize:18, fontWeight:700 }}>{fmt(restante)}</p>
              </div>
              <div style={{ marginTop:10, padding:'12px 14px', background:'#FFF3ED', borderRadius:10, border:'1px solid rgba(255,98,0,0.12)' }}>
                <p style={{ color:'#9AAAB8', fontSize:11, marginBottom:4 }}>Meta mensal atualizada</p>
                <p style={{ color:'#FF6200', fontSize:18, fontWeight:700 }}>{fmt(metaMesAtualizada)}</p>
                <p style={{ color:'#9AAAB8', fontSize:10, marginTop:2 }}>↻ ajustada pelo saldo acumulado</p>
              </div>
            </>
          )}
        </div>

        {/* Gráfico mensal */}
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:16 }}>Contas alcançadas por mês</p>
          <div className="chart-wrapper"><ResponsiveContainer width="100%" height={mobile ? 170 : 240}>
            <BarChart data={byMonth} barSize={mobile ? 16 : 28} margin={{top: mobile ? 4 : 24, right:8, left:0, bottom:0}}>
              <XAxis dataKey="mes" tick={{ fill:'#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v=>v===0?'':fmt(v)} width={mobile ? 36 : 44}/>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  const pct = d.meta > 0 && d.total > 0 ? Math.round((d.total / d.meta) * 100) : null
                  return (
                    <div style={{ background:'#fff', border:'1px solid #EAECF0', borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', fontSize:12, minWidth:180 }}>
                      <p style={{ fontWeight:700, color:'#1C252E', marginBottom:6 }}>{d.mesFull}</p>
                      <p style={{ color:'#9AAAB8', marginBottom:4 }}>{d.count} posts publicados</p>
                      <p style={{ color:'#1C252E', fontWeight:600, marginBottom:2 }}>Alcance: <strong>{fmt(d.total)}</strong></p>
                      <p style={{ color:'#9AAAB8', marginBottom: pct != null ? 6 : 0 }}>Meta: {fmt(d.meta)}</p>
                      {pct != null && (
                        <p style={{ color:'#FF6200', fontWeight:800, fontSize:14 }}>{pct}% da meta</p>
                      )}
                    </div>
                  )
                }}
                cursor={{ fill:'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="total" radius={[6,6,0,0]}>
                {byMonth.map((entry, i) => (
                  <Cell key={i} fill={entry.total === 0 ? '#F0F2F5' : '#C3EBF7'} />
                ))}
                <LabelList dataKey="pctMes" position="top"
                  formatter={v => v != null ? `${v}%` : ''}
                  style={{ fontSize: mobile ? 8 : 10, fontWeight:700, fill:'#9AAAB8' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>

      {/* ── Performance por tipo + Temas ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="annual-grid">

        {/* Por tipo */}
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:18 }}>Performance por tipo</p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {porTipo.map((t,i)=>(
              <div key={t.tipo}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:TIPO_COLOR[t.tipo]==='#C3EBF7'?'#7ecde8':TIPO_COLOR[t.tipo] }}/>
                    <span style={{ color:'#1C252E', fontSize:13, fontWeight:500 }}>{t.tipo}</span>
                    {i===0&&t.total>0&&(
                      <span style={{ background:'rgba(255,98,0,0.1)', color:'#FF6200', borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:700 }}>Líder</span>
                    )}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ color:'#1C252E', fontSize:14, fontWeight:700 }}>{fmt(t.total)}</span>
                    <span style={{ color:'#9AAAB8', fontSize:11, marginLeft:6 }}>{t.count} posts</span>
                  </div>
                </div>
                <div style={{ background:'#F0F2F5', borderRadius:4, height:6, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:4,
                    background: TIPO_COLOR[t.tipo]==='#C3EBF7' ? '#7ecde8' : TIPO_COLOR[t.tipo],
                    width:`${(t.total/maxTipo)*100}%`, transition:'width 0.5s ease'
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por tema */}
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:18 }}>Top temas</p>
          {porTema.length === 0 ? (
            <p style={{ color:'#9AAAB8', fontSize:13, textAlign:'center', marginTop:32 }}>Adicione temas aos posts para ver aqui</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {porTema.map(([tema,val],i)=>{
                const maxVal = porTema[0][1]
                return (
                  <div key={tema}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {i===0&&<span style={{ fontSize:13 }}>🏆</span>}
                        <span style={{ color:'#1C252E', fontSize:13, fontWeight:500 }}>{tema}</span>
                      </div>
                      <span style={{ color:'#1C252E', fontSize:13, fontWeight:700 }}>{fmt(val)}</span>
                    </div>
                    <div style={{ background:'#F0F2F5', borderRadius:4, height:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:4, background:'#C3EBF7', width:`${(val/maxVal)*100}%`, transition:'width 0.5s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
