import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import LinkedinVisaoGeral from './LinkedinVisaoGeral'
import LinkedinBiblioteca from './LinkedinBiblioteca'
import LinkedinVisaoMensal from './LinkedinVisaoMensal'
import LinkedinPilula from './LinkedinPilula'
import LinkedinUploadModal from './LinkedinUploadModal'
import LinkedinImportModal from './LinkedinImportModal'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function LinkedinView({ tab = 'geral' }) {
  const {
    linkedinPosts, addLinkedinPost, updateLinkedinPost, deleteLinkedinPost, deleteManyLinkedinPosts, importLinkedinPosts, isEditMode,
    linkedinAction, setLinkedinAction, linkedinAnoFiltro, linkedinMesBiblioteca,
  } = useStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editPost, setEditPost]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  // Mês para a aba mensal (pills) — permanece local
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0')
  const [mes, setMes] = useState(mesAtual)

  // Reage ao trigger do TopBar
  useEffect(() => {
    if (!linkedinAction) return
    if (linkedinAction === 'upload') setUploadOpen(true)
    if (linkedinAction === 'import') setImportOpen(true)
    setLinkedinAction(null)
  }, [linkedinAction])

  const ano         = linkedinAnoFiltro
  const mesBiblioteca = linkedinMesBiblioteca

  const postsAno = linkedinPosts.filter(p => p.data_post?.split('/')?.[2] === ano)
  const postsMes = linkedinPosts.filter(p => {
    const parts = p.data_post?.split('/')
    return parts?.[1] === mes
  })

  async function handleSaveNew(post)  { await addLinkedinPost(post) }
  async function handleSaveEdit(post) { await updateLinkedinPost(post); setEditPost(null) }
  async function handleDelete(id)     { await deleteLinkedinPost(id); setConfirmDel(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Pills de mês — só na aba mensal (permanecem inline) */}
      {tab === 'formato' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MESES_LABEL.map((label, i) => {
            const mm = String(i + 1).padStart(2, '0')
            const ativo = mes === mm
            return (
              <button key={mm} onClick={() => setMes(mm)} style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: ativo ? 700 : 400,
                background: ativo ? '#1C252E' : '#F0F4F8',
                color: ativo ? '#C3EBF7' : '#6B7A8D',
                transition: 'all 0.12s',
              }}>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Conteúdo da aba */}
      {tab === 'geral'      && <LinkedinVisaoGeral posts={postsAno} ano={ano} isEditMode={isEditMode} onEditPost={setEditPost}/>}
      {tab === 'biblioteca' && <LinkedinBiblioteca allPosts={linkedinPosts} mesFiltro={mesBiblioteca} isEditMode={isEditMode} onEditPost={setEditPost} onDeletePost={setConfirmDel} onDeleteMany={deleteManyLinkedinPosts}/>}
      {tab === 'formato'    && <LinkedinVisaoMensal posts={postsMes} mes={mes} isEditMode={isEditMode} onEditPost={setEditPost}/>}
      {tab === 'pilula'     && <LinkedinPilula posts={postsAno} ano={ano}/>}

      {/* Modal importação XLS */}
      {importOpen && isEditMode && (
        <LinkedinImportModal
          onClose={() => setImportOpen(false)}
          onImport={async (posts) => { await importLinkedinPosts(posts) }}
        />
      )}

      {/* Modais */}
      {uploadOpen && isEditMode && (
        <LinkedinUploadModal mode="new" onClose={() => setUploadOpen(false)} onSave={handleSaveNew}/>
      )}
      {editPost && isEditMode && (
        <LinkedinUploadModal mode="edit" initial={editPost} onClose={() => setEditPost(null)} onSave={handleSaveEdit} onDelete={id => { handleDelete(id); setEditPost(null) }}/>
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
