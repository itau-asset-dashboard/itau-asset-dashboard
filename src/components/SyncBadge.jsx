import { useStore } from '../store/useStore'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'

export default function SyncBadge() {
  const { syncing, syncError, syncFromCloud } = useStore()

  if (syncing) return (
    <div style={badge}>
      <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} color="#8A9BB0" />
      <span style={{ color: '#8A9BB0', fontSize: 11 }}>Sincronizando…</span>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )

  if (syncError) return (
    <div style={{ ...badge, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
      onClick={syncFromCloud} title="Clique para tentar novamente">
      <CloudOff size={12} color="#f87171" />
      <span style={{ color: '#f87171', fontSize: 11 }}>Offline</span>
    </div>
  )

  return (
    <div style={badge}>
      <Cloud size={12} color="#16a34a" />
      <span style={{ color: '#16a34a', fontSize: 11 }}>Sincronizado</span>
    </div>
  )
}

const badge = {
  position: 'fixed', bottom: 16, left: 80,
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: '1px solid #E8ECF0',
  borderRadius: 20, padding: '5px 10px',
  display: 'flex', alignItems: 'center', gap: 5,
  zIndex: 50,
}
