import { useStore } from '../store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Users, TrendingUp, Award, FileText } from 'lucide-react'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(n) {
  if (n==null||n===0) return '—'
  if (n>=1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n>=1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

export default function AnnualView() {
  const { getPostsDoAno, metaAnual, mesFiltro } = useStore()
  const ano = mesFiltro?.split('/')?.[1] || '2026'
  const posts = getPostsDoAno(ano)

  const total  = posts.reduce((s,p)=>s+(p.contas_alcancadas||0),0)
  const media  = posts.length>0 ? Math.round(total/posts.length) : 0
  const melhor = posts.length>0 ? posts.reduce((a,b)=>(a.contas_alcancadas||0)>(b.contas_alcancadas||0)?a:b,posts[0]) : null
  const pct    = metaAnual>0 ? Math.min((total/metaAnual)*100,100) : 0
  const metaMes = Math.round(metaAnual/12)

  // Dados mensais
  const byMonth = Array.from({length:12},(_,i)=>{
    const mm = String(i+1).padStart(2,'0')
    const mPosts = posts.filter(p=>{
      const parts = p.data_post?.split('/')
      return parts?.[1]===mm && parts?.[2]===ano
    })
    return {
      mes: MESES_LABEL[i],
      total: mPosts.reduce((s,p)=>s+(p.contas_alcancadas||0),0),
      count: mPosts.length,
    }
  })

  const CARDS = [
    { label:'Total anual',      value: fmt(total),                   sub:`${pct.toFixed(0)}% da meta`,           color:'#FF6200', bg:'rgba(255,98,0,0.06)',    icon:Users },
    { label:'Média por post',   value: fmt(media),                   sub:'contas / publicação',                   color:'#1C252E', bg:'rgba(28,37,46,0.03)',    icon:TrendingUp },
    { label:'Melhor post',      value: fmt(melhor?.contas_alcancadas),sub:(melhor?.nome||'—').slice(0,24),         color:'#1a7a96', bg:'rgba(195,235,247,0.2)',  icon:Award },
    { label:'Posts cadastrados',value: String(posts.length),          sub:`${posts.filter(p=>p.status==='parcial').length} parciais`, color:'#1C252E', bg:'rgba(28,37,46,0.03)', icon:FileText },
  ]

  // Por tipo
  const tipos = ['Carrossel','Reels','Foto estática']
  const TIPO_COLOR = { Carrossel:'#FF6200', Reels:'#1C252E', 'Foto estática':'#C3EBF7' }
  const porTipo = tipos.map(t=>({
    tipo: t,
    total: posts.filter(p=>p.tipo===t).reduce((s,p)=>s+(p.contas_alcancadas||0),0),
    count: posts.filter(p=>p.tipo===t).length,
  })).sort((a,b)=>b.total-a.total)
  const maxTipo = Math.max(...porTipo.map(t=>t.total),1)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, paddingTop:4 }}>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {CARDS.map(({label,value,sub,color,bg,icon:Icon})=>(
          <div key={label} className="card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:bg, borderRadius:18 }}/>
            <div style={{ position:'relative' }}>
              <div style={{ width:34, height:34, borderRadius:9, background:bg, border:`1px solid ${color}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Icon size={16} color={color} strokeWidth={2.1}/>
              </div>
              <p style={{ color:'#8A9BB0', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>{label}</p>
              <p style={{ color:'#1C252E', fontSize:24, fontWeight:700, lineHeight:1.1, marginBottom:2 }}>{value}</p>
              <p style={{ color:'#8A9BB0', fontSize:12 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progresso meta anual */}
      <div className="card" style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Meta anual {ano}</h2>
            <p style={{ color:'#8A9BB0', fontSize:12, marginTop:2 }}>Meta mensal referência: {fmt(metaMes)}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ color:'#FF6200', fontSize:22, fontWeight:800 }}>{fmt(total)}</p>
            <p style={{ color:'#8A9BB0', fontSize:12 }}>de {fmt(metaAnual)}</p>
          </div>
        </div>
        <div style={{ background:'#E8ECF0', borderRadius:6, height:10, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:6, background:'#FF6200', width:`${pct}%`, transition:'width 0.6s ease' }}/>
        </div>
        <p style={{ color:'#8A9BB0', fontSize:12, marginTop:8 }}>
          {pct.toFixed(1)}% atingido · faltam <span style={{ color:'#FF6200', fontWeight:700 }}>{fmt(Math.max(metaAnual-total,0))}</span>
        </p>
      </div>

      {/* Gráfico mensal */}
      <div className="card" style={{ padding:'18px 20px' }}>
        <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:4 }}>Contas alcançadas por mês</h2>
        <p style={{ color:'#8A9BB0', fontSize:12, marginBottom:16 }}>Todos os posts de {ano}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMonth} barSize={28}>
            <XAxis dataKey="mes" tick={{ fill:'#8A9BB0', fontSize:12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'#8A9BB0', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>v===0?'':fmt(v)} width={46}/>
            <Tooltip formatter={v=>[fmt(v),'Contas']} labelStyle={{ color:'#1C252E', fontWeight:600 }} contentStyle={{ borderRadius:10, border:'1px solid #E8ECF0', fontSize:12 }}/>
            <ReferenceLine y={metaMes} stroke="#FF6200" strokeDasharray="4 3" strokeOpacity={0.5}/>
            <Bar dataKey="total" radius={[5,5,0,0]}>
              {byMonth.map((entry,i)=>(
                <Cell key={i} fill={entry.total>=metaMes ? '#FF6200' : '#C3EBF7'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ color:'#8A9BB0', fontSize:11, marginTop:8, textAlign:'right' }}>
          — linha pontilhada = meta mensal ({fmt(metaMes)})
        </p>
      </div>

      {/* Performance por tipo */}
      <div className="card" style={{ padding:'18px 20px' }}>
        <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:16 }}>Performance por tipo — {ano}</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {porTipo.map((t,i)=>(
            <div key={t.tipo}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:TIPO_COLOR[t.tipo], display:'inline-block' }}/>
                  <span style={{ color:'#1C252E', fontSize:13, fontWeight:600 }}>{t.tipo}</span>
                  {i===0&&t.total>0&&<span style={{ background:'rgba(255,98,0,0.1)', color:'#FF6200', borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:700 }}>Líder</span>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ color:TIPO_COLOR[t.tipo]==='#C3EBF7'?'#0891B2':TIPO_COLOR[t.tipo], fontSize:14, fontWeight:700 }}>{fmt(t.total)}</span>
                  <span style={{ color:'#8A9BB0', fontSize:11, marginLeft:6 }}>{t.count} posts</span>
                </div>
              </div>
              <div style={{ background:'#E8ECF0', borderRadius:4, height:7, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, background:TIPO_COLOR[t.tipo]==='#C3EBF7'?'#C3EBF7':TIPO_COLOR[t.tipo], width:`${(t.total/maxTipo)*100}%`, transition:'width 0.5s ease' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
