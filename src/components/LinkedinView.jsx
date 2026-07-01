import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useIsMobile } from '../utils/useIsMobile'
import LinkedinVisaoGeral from './LinkedinVisaoGeral'
import LinkedinBiblioteca from './LinkedinBiblioteca'
import LinkedinPorFormato from './LinkedinPorFormato'
import LinkedinUploadModal from './LinkedinUploadModal'

const TABS = [
  { id: 'geral',      label: 'Visão Geral' },
  { id: 'biblioteca', label: 'Biblioteca de Conteúdo' },
  { id: 'formato',    label: 'Performance por Formato' },
]

const ANOS = ['2024', '2025', '2026', '2027']

export default function LinkedinView() {
  const { linkedinPosts, addLinkedinPost, updateLinkedinPost, deleteLinkedinPost, isEditMode } = useStore()
  const mobile = useIsMobile()
  const [tab, setTab]               = useState('geral')
  const [ano, setAno]               = useState(String(new Date().getFullYear()))
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editPost, setEditPost]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const postsAno = linkedinPosts.filter(p => p.data_post?.split('/')?.[2] === ano)

  async function handleSaveNew(post)  { await addLinkedinPost(post) }
  async function handleSaveEdit(post) { await updateLinkedinPost(post); setEditPost(null) }
  async function handleDelete(id)     { await deleteLinkedinPost(id); setConfirmDel(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'rgba(28,37,46,0.06)', borderRadius: 12, padding: 3, gap: 2 }}>
          {TABS.map(t => {
            const shortLabel = t.id === 'biblioteca' ? 'Biblioteca' : t.id === 'formato' ? 'Por Formato' : t.label
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: mobile ? '5px 10px' : '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: mobile ? 11 : 13, fontWeight: tab === t.id ? 700 : 400,
                background: tab === t.id ? '#1C252E' : 'transparent',
                color: tab === t.id ? '#C3EBF7' : '#5A7080', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
                {mobile ? shortLabel : t.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={ano} onChange={e => setAno(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', cursor: 'pointer', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isEditMode && (
            <button onClick={() => setUploadOpen(true)} style={{
              background: '#0A66C2', color: '#fff', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>
              <Plus size={15}/> Novo post
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da aba */}
      {tab === 'geral'      && <LinkedinVisaoGeral posts={postsAno} ano={ano} isEditMode={isEditMode} onEditPost={setEditPost}/>}
      {tab === 'biblioteca' && <LinkedinBiblioteca allPosts={linkedinPosts} ano={ano} isEditMode={isEditMode} onEditPost={setEditPost} onDeletePost={setConfirmDel}/>}
      {tab === 'formato'    && <LinkedinPorFormato posts={postsAno} ano={ano}/>}

      {/* Modais */}
      {uploadOpen && isEditMode && (
        <LinkedinUploadModal mode="new" onClose={() => setUploadOpen(false)} onSave={handleSaveNew}/>
      )}
      {editPost && isEditMode && (
        <LinkedinUploadModal mode="edit" initial={editPost} onClose={() => setEditPost(null)} onSave={handleSaveEdit}/>
      )}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 320, width: '90%' }}>
            <p style={{ color: '#1C252E', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Remover post?</p>
            <p style={{ color: '#8A9BB0', fontSize: 13, marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer', color: '#4A5568' }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDel)} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
