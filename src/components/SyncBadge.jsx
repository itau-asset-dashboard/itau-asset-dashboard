import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Cloud, CloudOff, RefreshCw, Upload } from 'lucide-react'

export default function SyncBadge() {
  const { syncing, syncError, syncFromCloud, recoverLocalPosts, posts } = useStore()
  const [recovering, setRecovering] = useState(false)
  const [recovered, setRecovered]  = useState(null)

  async function handleRecover() {
    setRecovering(true)
    setRecovered(null)
    const n = await recoverLocalPosts()
    setRecovered(n)
    setRecovering(false)
    await syncFromCloud()
    setTimeout(() => setRecovered(null), 4000)
  }

  if (syncing || recovering) return (
    <div style={badge}>
      <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} color="#8A9BB0" />
      <span style={{ color: '#8A9BB0', fontSize: 11 }}>{recovering ? 'Recuperando...' : 'Sincronizando…'}</span>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )

  if (recovered !== null) return (
    <div style={{ ...badge, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
      <Cloud size={12} color="#16a34a" />
      <span style={{ color: '#16a34a', fontSize: 11 }}>{recovered} posts reenviados!</span>
    </div>
  )

  if (syncError) return (
    <div style={{ ...badge, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
      onClick={syncFromCloud} title="Clique para tentar novamente">
      <CloudOff size={12} color="#f87171" />
      <span style={{ color: '#f87171', fontSize: 11 }}>Offline — clique para tentar</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'fixed', bottom: 16, left: 80, zIndex: 50 }}>
      <div style={badge}>
        <Cloud size={12} color="#16a34a" />
        <span style={{ color: '#16a34a', fontSize: 11 }}>Sincronizado</span>
      </div>

      {/* Botão de recuperação — sempre visível */}
      <button onClick={handleRecover} title={`Reenviar ${posts.length} posts locais para a nuvem`}
        style={{
          ...badge, cursor: 'pointer', gap: 5,
          background: 'rgba(195,235,247,0.4)', border: '1px solid rgba(195,235,247,0.8)',
        }}>
        <Upload size={11} color="#0891B2" />
        <span style={{ color: '#0891B2', fontSize: 11 }}>Recuperar posts</span>
      </button>
    </div>
  )
}

const badge = {
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: '1px solid #E8ECF0',
  borderRadius: 20, padding: '5px 10px',
  display: 'flex', alignItems: 'center', gap: 5,
}
