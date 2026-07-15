import { useState } from 'react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'
import { PostRankRow } from './PostRankRow'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function TopPostsMes() {
  const getPostsDoMes = useStore(s => s.getPostsDoMes)
  const updatePost    = useStore(s => s.updatePost)
  const deletePost    = useStore(s => s.deletePost)
  const mesFiltro     = useStore(s => s.mesFiltro)
  const posts = getPostsDoMes()
  const [editTarget, setEditTarget] = useState(null)

  const top5 = [...posts]
    .sort((a, b) => (b.contas_alcancadas || 0) - (a.contas_alcancadas || 0))
    .slice(0, 5)

  const [mm, yyyy] = (mesFiltro || '').split('/')
  const mesNome = mm ? `${MESES_FULL[parseInt(mm, 10) - 1]} ${yyyy}` : ''

  if (top5.length === 0) return null

  const maxVal = top5[0].contas_alcancadas || 1

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: '#182638', fontSize: 15, fontWeight: 700 }}>Top 5 posts</p>
        <p style={{ color: '#A8B5C0', fontSize: 12, marginTop: 2 }}>{mesNome} · por contas alcançadas</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {top5.map((p, i) => (
          <PostRankRow
            key={p.id}
            post={p}
            i={i}
            maxVal={maxVal}
            onClick={() => setEditTarget(p)}
          />
        ))}
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
