import { useState } from 'react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'
import { temasLabel } from '../utils/temas'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',')+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',')+'K'
  return n.toLocaleString('pt-BR')
}

const TIPO_COLOR = { Carrossel:'#F97316', Reels:'#1C252E', 'Foto estática':'#0EA5E9' }
const TIPO_BG    = { Carrossel:'rgba(249,115,22,0.08)', Reels:'rgba(28,37,46,0.08)', 'Foto estática':'rgba(14,165,233,0.08)' }

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function TopPostsMes() {
  const { getPostsDoMes, updatePost, deletePost, mesFiltro } = useStore()
  const posts = getPostsDoMes()
  const [editTarget, setEditTarget] = useState(null)

  const top5 = [...posts]
    .sort((a,b) => (b.contas_alcancadas||0) - (a.contas_alcancadas||0))
    .slice(0, 5)

  const [mm, yyyy] = (mesFiltro || '').split('/')
  const mesNome = mm ? `${MESES_FULL[parseInt(mm,10)-1]} ${yyyy}` : ''

  if (top5.length === 0) return null

  const maxVal = top5[0].contas_alcancadas || 1

  return (
    <div className="card" style={{ padding:'22px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <p style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Top 5 posts</p>
          <p style={{ color:'#9AAAB8', fontSize:12, marginTop:2 }}>{mesNome} · por contas alcançadas</p>
        </div>
        <span style={{ background:'rgba(249,115,22,0.08)', color:'#F97316', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
          {posts.length} posts no mês
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {top5.map((p, i) => {
          const color = TIPO_COLOR[p.tipo] || '#0EA5E9'
          const bg    = TIPO_BG[p.tipo]    || 'rgba(14,165,233,0.08)'
          const pct   = maxVal > 0 ? ((p.contas_alcancadas||0) / maxVal) * 100 : 0
          const medals = ['🥇','🥈','🥉','4º','5º']
          return (
            <div key={p.id}
              onClick={() => setEditTarget(p)}
              style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'10px 12px', borderRadius:12, border:'1px solid #F0F4F8', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {/* Posição */}
              <span style={{ fontSize:16, flexShrink:0, width:24, textAlign:'center' }}>{medals[i]}</span>

              {/* Imagem ou placeholder */}
              {(p.imageUrl || p.imageData) ? (
                <img src={p.imageUrl || p.imageData} alt=""
                  style={{ width:42, height:42, objectFit:'cover', borderRadius:8, flexShrink:0 }}/>
              ) : (
                <div style={{ width:42, height:42, borderRadius:8, background:bg, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {p.tipo === 'Reels' ? '🎬' : p.tipo === 'Carrossel' ? '🎠' : '📷'}
                </div>
              )}

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'#1C252E', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }}>
                  {p.nome || temasLabel(p) || '—'}
                </p>
                <div style={{ background:'#F0F2F5', borderRadius:4, height:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background: i===0 ? '#F97316' : color, width:`${pct}%`, transition:'width 0.5s ease' }}/>
                </div>
              </div>

              {/* Valor */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ color: i===0 ? '#F97316' : '#1C252E', fontSize:15, fontWeight:800 }}>{fmt(p.contas_alcancadas)}</p>
                <p style={{ color:'#9AAAB8', fontSize:10, marginTop:1 }}>{p.data_post}</p>
              </div>
            </div>
          )
        })}
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
