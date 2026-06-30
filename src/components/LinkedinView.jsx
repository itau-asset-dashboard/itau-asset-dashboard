import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'
import LinkedinUploadModal from './LinkedinUploadModal'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(n) {
  if (n == null || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',')+'K'
  return Number(n).toLocaleString('pt-BR')
}
function fmtExato(n) {
  if (n == null || n === '') return '—'
  return Math.round(n).toLocaleString('pt-BR')
}
function fmtCtr(n) {
  if (n == null || n === '') return '—'
  return Number(n).toFixed(2).replace('.',',') + '%'
}
function mesKey(dateStr) {
  if (!dateStr) return null
  const p = dateStr.split('/')
  return p.length >= 3 ? `${p[1]}/${p[2]}` : null
}

export default function LinkedinView() {
  const { linkedinPosts, addLinkedinPost, updateLinkedinPost, deleteLinkedinPost, mesFiltro, isEditMode } = useStore()
  const mobile = useIsMobile()
  const [viewMode, setViewMode] = useState('anual')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editPost, setEditPost]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const ano = mesFiltro?.split('/')?.[1] || '2026'

  // Posts do ano
  const postsAno = linkedinPosts.filter(p => mesKey(p.data_post)?.endsWith(ano))
  // Posts do mês
  const postsMes = linkedinPosts.filter(p => mesKey(p.data_post) === mesFiltro)

  const basePosts = viewMode === 'anual' ? postsAno : postsMes

  // KPIs
  const totalImpressoes  = basePosts.reduce((s,p) => s+(p.impressoes||0), 0)
  const totalReacoes     = basePosts.reduce((s,p) => s+(p.reacoes||0), 0)
  const totalCliques     = basePosts.reduce((s,p) => s+(p.cliques||0), 0)
  const mediaCtr         = basePosts.filter(p=>p.ctr!=null).length
    ? (basePosts.reduce((s,p)=>s+(p.ctr||0),0) / basePosts.filter(p=>p.ctr!=null).length)
    : null
  const melhor = basePosts.length
    ? basePosts.reduce((a,b) => (a.impressoes||0) > (b.impressoes||0) ? a : b)
    : null

  // Dados mensais para gráfico anual
  const byMonth = Array.from({length:12},(_,i) => {
    const mm = String(i+1).padStart(2,'0')
    const ps = postsAno.filter(p => { const pt = p.data_post?.split('/'); return pt?.[1]===mm && pt?.[2]===ano })
    return {
      mes: MESES_LABEL[i],
      mesFull: MESES_FULL[i],
      impressoes: ps.reduce((s,p)=>s+(p.impressoes||0),0),
      count: ps.length,
    }
  })

  const KPIS = viewMode === 'anual'
    ? [
        { label:'Impressões no ano',  value: fmtExato(totalImpressoes), sub:`${postsAno.length} posts` },
        { label:'Reações totais',     value: fmtExato(totalReacoes),    sub:'curtidas e reações' },
        { label:'Cliques totais',     value: fmtExato(totalCliques),    sub:'no conteúdo' },
        { label:'CTR médio',          value: fmtCtr(mediaCtr),          sub:'taxa de cliques' },
      ]
    : [
        { label:'Impressões',  value: fmtExato(totalImpressoes), sub:`${postsMes.length} posts em ${mesFiltro}` },
        { label:'Reações',     value: fmtExato(totalReacoes),    sub:'curtidas e reações' },
        { label:'Cliques',     value: fmtExato(totalCliques),    sub:'no conteúdo' },
        { label:'CTR médio',   value: fmtCtr(mediaCtr),          sub:'taxa de cliques' },
      ]

  async function handleSaveNew(post) {
    await addLinkedinPost(post)
    setUploadOpen(false)
  }
  async function handleSaveEdit(post) {
    await updateLinkedinPost(post)
    setEditPost(null)
  }
  async function handleDelete(id) {
    await deleteLinkedinPost(id)
    setConfirmDel(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header com toggle + botão novo */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:'#F4F6F8', borderRadius:12, padding:3, gap:2 }}>
          {['anual','mensal'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: mobile ? '5px 14px' : '6px 18px', borderRadius:10, border:'none', cursor:'pointer',
              fontSize:13, fontWeight: viewMode===mode ? 700 : 400,
              background: viewMode===mode ? '#1C252E' : 'transparent',
              color: viewMode===mode ? '#C3EBF7' : '#5A7080', transition:'all 0.15s',
            }}>
              {mode === 'anual' ? 'Anual' : 'Mensal'}
            </button>
          ))}
        </div>
        {isEditMode && (
          <button onClick={() => setUploadOpen(true)} style={{
            background:'#0A66C2', color:'#fff', border:'none', borderRadius:10,
            padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', gap:5,
          }}>
            <Plus size={15}/> Novo post
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: mobile ? 8 : 14 }}>
        {KPIS.map(({ label, value, sub }) => (
          <div key={label} className="card" style={{ padding: mobile ? '12px 14px' : '18px 20px' }}>
            <p style={{ color:'#8A9BB0', fontSize: mobile ? 9 : 11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom: mobile ? 6 : 10 }}>{label}</p>
            <p style={{ color:'#182638', fontSize: mobile ? 20 : 26, fontWeight:800, lineHeight:1, letterSpacing:'-0.02em', marginBottom:4 }}>{value}</p>
            <p style={{ color:'#A8B5C0', fontSize: mobile ? 10 : 12 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico anual */}
      {viewMode === 'anual' && (
        <div className="card" style={{ padding:'22px' }}>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700, marginBottom:16 }}>Impressões por mês — {ano}</p>
          <ResponsiveContainer width="100%" height={mobile ? 160 : 220}>
            <BarChart data={byMonth} barSize={mobile ? 16 : 26} margin={{ top:16, right:8, left:0, bottom:0 }}>
              <XAxis dataKey="mes" tick={{ fill:'#9AAAB8', fontSize: mobile ? 9 : 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#9AAAB8', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v===0 ? '' : fmt(v)} width={mobile ? 36 : 44}/>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background:'#fff', border:'1px solid #EAECF0', borderRadius:12, padding:'10px 14px', fontSize:12 }}>
                    <p style={{ fontWeight:700, color:'#1C252E', marginBottom:4 }}>{d.mesFull}</p>
                    <p style={{ color:'#9AAAB8' }}>{d.count} posts</p>
                    <p style={{ color:'#0A66C2', fontWeight:700 }}>{fmtExato(d.impressoes)} impressões</p>
                  </div>
                )
              }} cursor={{ fill:'rgba(0,0,0,0.03)' }}/>
              <Bar dataKey="impressoes" radius={[6,6,0,0]}>
                {byMonth.map((e,i) => <Cell key={i} fill={e.impressoes===0 ? '#F0F2F5' : '#0A66C2'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ranking de posts */}
      {basePosts.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 20px 12px', borderBottom:'1px solid #F0F4F8' }}>
            <p style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>
              {viewMode === 'anual' ? `Posts ${ano}` : `Posts de ${mesFiltro}`} · ordenado por impressões
            </p>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth: mobile ? 500 : 'auto' }}>
              <thead>
                <tr style={{ background:'#FAFBFC' }}>
                  {['Post','Data','Impressões','Visual.','Cliques','CTR','Reações',''].map(h => (
                    <th key={h} style={{ padding:'10px 16px', color:'#8A9BB0', fontSize:10, fontWeight:600,
                      textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...basePosts].sort((a,b)=>(b.impressoes||0)-(a.impressoes||0)).map((p,i) => (
                  <tr key={p.id} style={{ borderTop:'1px solid #F5F7FA' }}>
                    <td style={{ padding:'12px 16px', maxWidth:200 }}>
                      <p style={{ color:'#1C252E', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {i===0 && <span style={{ background:'rgba(255,98,0,0.1)', color:'#FF6200', borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:700, marginRight:6 }}>Top</span>}
                        {p.nome || '—'}
                      </p>
                      {Array.isArray(p.tema) && p.tema.length > 0 && (
                        <p style={{ color:'#B0BEC5', fontSize:11, marginTop:2 }}>{p.tema.join(' · ')}</p>
                      )}
                    </td>
                    <td style={{ padding:'12px 16px', color:'#9AAAB8', fontSize:12, whiteSpace:'nowrap' }}>{p.data_post || '—'}</td>
                    <td style={{ padding:'12px 16px', color:'#0A66C2', fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>{fmtExato(p.impressoes)}</td>
                    <td style={{ padding:'12px 16px', color:'#1C252E', fontSize:13, whiteSpace:'nowrap' }}>{fmtExato(p.visualizacoes)}</td>
                    <td style={{ padding:'12px 16px', color:'#1C252E', fontSize:13, whiteSpace:'nowrap' }}>{fmtExato(p.cliques)}</td>
                    <td style={{ padding:'12px 16px', color:'#1C252E', fontSize:13, whiteSpace:'nowrap' }}>{fmtCtr(p.ctr)}</td>
                    <td style={{ padding:'12px 16px', color:'#1C252E', fontSize:13, whiteSpace:'nowrap' }}>{fmtExato(p.reacoes)}</td>
                    <td style={{ padding:'12px 12px', whiteSpace:'nowrap' }}>
                      {isEditMode && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => setEditPost(p)} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#6B7A8D', fontSize:12 }}>
                            <Edit2 size={12}/> Editar
                          </button>
                          <button onClick={() => setConfirmDel(p.id)} style={{ background:'rgba(239,68,68,0.08)', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center', color:'#ef4444', fontSize:12 }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {basePosts.length === 0 && (
        <div className="card" style={{ padding:'48px 20px', textAlign:'center' }}>
          <p style={{ color:'#9AAAB8', fontSize:14 }}>Nenhum post LinkedIn cadastrado{viewMode === 'mensal' ? ` em ${mesFiltro}` : ` em ${ano}`}.</p>
          {isEditMode && <p style={{ color:'#C3EBF7', fontSize:12, marginTop:6 }}>Clique em "Novo post" para começar.</p>}
        </div>
      )}

      {/* Modais */}
      {uploadOpen && isEditMode && (
        <LinkedinUploadModal mode="new" onClose={() => setUploadOpen(false)} onSave={handleSaveNew}/>
      )}
      {editPost && isEditMode && (
        <LinkedinUploadModal mode="edit" initial={editPost} onClose={() => setEditPost(null)} onSave={handleSaveEdit}/>
      )}

      {/* Confirmação de exclusão */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, maxWidth:320, width:'90%' }}>
            <p style={{ color:'#1C252E', fontWeight:700, fontSize:14, marginBottom:8 }}>Remover post?</p>
            <p style={{ color:'#8A9BB0', fontSize:13, marginBottom:20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex:1, background:'#F4F6F8', border:'none', borderRadius:8, padding:'9px', fontSize:13, cursor:'pointer', color:'#4A5568' }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ flex:1, background:'#ef4444', color:'#fff', border:'none', borderRadius:8, padding:'9px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
