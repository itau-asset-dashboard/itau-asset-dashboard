import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import LinkedinVisaoGeral from './LinkedinVisaoGeral'
import LinkedinBiblioteca from './LinkedinBiblioteca'
import LinkedinVisaoMensal from './LinkedinVisaoMensal'
import LinkedinPilula from './LinkedinPilula'
import LinkedinUploadModal from './LinkedinUploadModal'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function LinkedinView({ tab = 'geral' }) {
  const { linkedinPosts, addLinkedinPost, updateLinkedinPost, deleteLinkedinPost, isEditMode } = useStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editPost, setEditPost]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  // Anos com posts reais
  const anosComPosts = useMemo(() => {
    const set = new Set(linkedinPosts.map(p => p.data_post?.split('/')?.[2]).filter(Boolean))
    return [...set].sort()
  }, [linkedinPosts])

  const defaultAno = String(new Date().getFullYear())
  const [ano, setAno] = useState(anosComPosts.includes(defaultAno) ? defaultAno : (anosComPosts[anosComPosts.length - 1] || defaultAno))

  // Mês para a aba mensal (pills)
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0')
  const [mes, setMes] = useState(mesAtual)

  // Mês/ano para a aba biblioteca (select dropdown) — "MM/YYYY"
  const mesesComPosts = useMemo(() => {
    const set = new Set(
      linkedinPosts
        .map(p => { const pts = p.data_post?.split('/'); return pts?.[1] && pts?.[2] ? `${pts[1]}/${pts[2]}` : null })
        .filter(Boolean)
    )
    return [...set].sort((a, b) => {
      const [ma, ya] = a.split('/'); const [mb, yb] = b.split('/')
      return ya !== yb ? Number(ya) - Number(yb) : Number(ma) - Number(mb)
    })
  }, [linkedinPosts])

  const defaultMesFiltro = (() => {
    const cur = `${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`
    return mesesComPosts.includes(cur) ? cur : (mesesComPosts[mesesComPosts.length - 1] || cur)
  })()
  const [mesBiblioteca, setMesBiblioteca] = useState(defaultMesFiltro)

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

      {/* Controles de filtro */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>

        {/* Filtro de mês — aba biblioteca (select dropdown) */}
        {tab === 'biblioteca' && mesesComPosts.length > 0 && (
          <select value={mesBiblioteca} onChange={e => setMesBiblioteca(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', cursor: 'pointer', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {mesesComPosts.map(mv => {
              const [mm, yyyy] = mv.split('/')
              return <option key={mv} value={mv}>{MESES_FULL[parseInt(mm,10)-1]} {yyyy}</option>
            })}
          </select>
        )}

        {/* Filtro de ano — na aba anual e pílula */}
        {(tab === 'geral' || tab === 'pilula') && anosComPosts.length > 0 && (
          <select value={ano} onChange={e => setAno(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', cursor: 'pointer', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {anosComPosts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}

        {/* Filtro de mês — só na aba mensal */}
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

      {/* Conteúdo da aba */}
      {tab === 'geral'      && <LinkedinVisaoGeral posts={postsAno} ano={ano} isEditMode={isEditMode} onEditPost={setEditPost}/>}
      {tab === 'biblioteca' && <LinkedinBiblioteca allPosts={linkedinPosts} mesFiltro={mesBiblioteca} isEditMode={isEditMode} onEditPost={setEditPost} onDeletePost={setConfirmDel}/>}
      {tab === 'formato'    && <LinkedinVisaoMensal posts={postsMes} mes={mes} isEditMode={isEditMode} onEditPost={setEditPost}/>}
      {tab === 'pilula'     && <LinkedinPilula posts={postsAno} ano={ano}/>}

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
