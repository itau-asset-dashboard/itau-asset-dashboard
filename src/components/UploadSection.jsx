import { useState } from 'react'
import { Upload, Sparkles, Trash2, AlertTriangle, CloudUpload } from 'lucide-react'
import { useStore } from '../store/useStore'
import { uploadImage } from '../lib/supabase'
import UploadModal from './UploadModal'

export default function UploadSection() {
  const { addPost, posts, deletePostsAntigos, updatePost } = useStore()
  const [open, setOpen] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [deletados, setDeletados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  // Posts que têm imagem local mas ainda não têm URL no Storage
  const postsParaSincronizar = posts.filter(p => p.imageData && !p.imageUrl)

  async function handleSyncImages() {
    if (syncing) return
    setSyncing(true)
    setSyncResult(null)
    let ok = 0, fail = 0
    for (const p of postsParaSincronizar) {
      try {
        const url = await uploadImage(p.id, p.imageData)
        if (url) {
          await updatePost(p.id, { imageUrl: url })
          ok++
        } else {
          fail++
        }
      } catch (_) {
        fail++
      }
    }
    setSyncing(false)
    setSyncResult({ ok, fail })
  }

  const antigos = posts.filter(p => {
    const ano = p.data_post?.split('/')?.[2]
    return ano && parseInt(ano, 10) < 2026
  })

  async function handleLimpeza() {
    if (!confirmando) { setConfirmando(true); return }
    setLoading(true)
    const n = await deletePostsAntigos()
    setDeletados(n)
    setConfirmando(false)
    setLoading(false)
  }

  return (
    <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Adicionar post</h2>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Extração automática de métricas via IA</p>
      </div>

      <div className="card" style={{
        padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        cursor: 'pointer', border: '2px dashed #D8EEF6', boxShadow: 'none', background: '#FAFCFE', transition: 'all 0.15s',
      }}
        onClick={() => setOpen(true)}
        onMouseEnter={e => { e.currentTarget.style.background = '#F0F8FF'; e.currentTarget.style.borderColor = '#C3EBF7' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FAFCFE'; e.currentTarget.style.borderColor = '#D8EEF6' }}
      >
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(195,235,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={26} color="#1a7a96" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#1C252E', fontSize: 16, fontWeight: 700, marginBottom: 5 }}>Arraste o print aqui</p>
          <p style={{ color: '#8A9BB0', fontSize: 13 }}>ou clique para selecionar uma imagem</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(195,235,247,0.35)', border: '1px solid rgba(195,235,247,0.8)', padding: '7px 14px', borderRadius: 20 }}>
          <Sparkles size={13} color="#1a7a96" />
          <span style={{ color: '#1a7a96', fontSize: 12, fontWeight: 600 }}>Extração automática via Claude IA</span>
        </div>
      </div>

      {/* Painel de sincronização de imagens */}
      {postsParaSincronizar.length > 0 && !syncResult && (
        <div className="card" style={{ padding: '16px 20px', border: '1px solid rgba(195,235,247,0.8)', background: 'rgba(195,235,247,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <CloudUpload size={16} color="#1a7a96" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: '#182638', fontSize: 13, fontWeight: 600 }}>
                  {postsParaSincronizar.length} evidência{postsParaSincronizar.length > 1 ? 's' : ''} só no seu dispositivo
                </p>
                <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 3 }}>
                  Clique para subir todas para a nuvem e aparecerem em qualquer dispositivo.
                </p>
              </div>
            </div>
            <button
              onClick={handleSyncImages}
              disabled={syncing}
              style={{
                flexShrink: 0,
                background: '#1a7a96', color: '#fff',
                border: 'none', borderRadius: 8, padding: '7px 14px',
                fontSize: 12, fontWeight: 600,
                cursor: syncing ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: syncing ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}>
              <CloudUpload size={12} />
              {syncing ? `Sincronizando…` : 'Sincronizar tudo'}
            </button>
          </div>
          {syncing && (
            <p style={{ color: '#1a7a96', fontSize: 11, marginTop: 10, marginLeft: 26 }}>
              Isso pode levar alguns segundos dependendo da quantidade de imagens…
            </p>
          )}
        </div>
      )}

      {syncResult && (
        <div className="card" style={{ padding: '14px 20px', border: `1px solid ${syncResult.fail > 0 ? '#FEE2E2' : '#DCFCE7'}`, background: syncResult.fail > 0 ? '#FFFBFB' : '#F0FDF4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{syncResult.fail > 0 ? '⚠️' : '✓'}</span>
          <p style={{ color: syncResult.fail > 0 ? '#EF4444' : '#16A34A', fontSize: 13, fontWeight: 600 }}>
            {syncResult.ok} imagem{syncResult.ok !== 1 ? 's' : ''} sincronizada{syncResult.ok !== 1 ? 's' : ''} com sucesso
            {syncResult.fail > 0 ? ` · ${syncResult.fail} falharam` : ''}
          </p>
        </div>
      )}

      {/* Painel de limpeza — só aparece se houver posts fora de 2026 */}
      {antigos.length > 0 && deletados === null && (
        <div className="card" style={{ padding: '16px 20px', border: '1px solid #FEE2E2', background: '#FFFBFB' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: '#182638', fontSize: 13, fontWeight: 600 }}>
                  {antigos.length} post{antigos.length > 1 ? 's' : ''} com data anterior a 2026
                </p>
                <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 3 }}>
                  {antigos.map(p => p.nome || p.data_post).slice(0, 3).join(' · ')}
                  {antigos.length > 3 ? ` · +${antigos.length - 3} outros` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLimpeza}
              disabled={loading}
              style={{
                flexShrink: 0,
                background: confirmando ? '#EF4444' : '#FEF2F2',
                color: confirmando ? '#fff' : '#EF4444',
                border: `1px solid ${confirmando ? '#EF4444' : '#FECACA'}`,
                borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              <Trash2 size={12} />
              {loading ? 'Excluindo…' : confirmando ? 'Confirmar exclusão' : 'Excluir todos'}
            </button>
          </div>
          {confirmando && (
            <p style={{ color: '#EF4444', fontSize: 11, marginTop: 10, marginLeft: 26 }}>
              ⚠️ Esta ação é irreversível. Clique em "Confirmar exclusão" para deletar os {antigos.length} posts.
            </p>
          )}
        </div>
      )}

      {deletados !== null && (
        <div className="card" style={{ padding: '14px 20px', border: '1px solid #DCFCE7', background: '#F0FDF4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <p style={{ color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
            {deletados} post{deletados !== 1 ? 's' : ''} excluído{deletados !== 1 ? 's' : ''} com sucesso.
          </p>
        </div>
      )}

      {open && (
        <UploadModal mode="new" onClose={() => setOpen(false)}
          onSave={dados => addPost(dados)} />
      )}
    </div>
  )
}
