import { useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

/**
 * Lightbox lateral — desliza pela direita, empurra o conteúdo.
 * Props: src (string), onClose (fn), title (string, opcional)
 */
export default function ImageLightbox({ src, onClose, title }) {
  // Fecha com Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!src) return null

  function handleDownload() {
    if (src.startsWith('http')) {
      window.open(src, '_blank')
      return
    }
    // base64 → download
    const a = document.createElement('a')
    a.href = src
    a.download = title ? `${title}.jpg` : 'evidencia.jpg'
    a.click()
  }

  return (
    <>
      {/* Overlay escuro atrás */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,36,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 400,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Painel lateral */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(560px, 90vw)',
        background: '#111827',
        zIndex: 401,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.35)',
        animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
              {title || 'Evidência'}
            </p>
            <p style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>Imagem original sem compressão</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownload} title="Abrir / baixar"
              style={{
                background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Download size={14} color="#94A3B8" />
            </button>
            <button onClick={onClose} title="Fechar (Esc)"
              style={{
                background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <X size={14} color="#94A3B8" />
            </button>
          </div>
        </div>

        {/* Imagem — scroll vertical se for muito alta */}
        <div style={{
          flex: 1, overflow: 'auto', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: '20px 16px',
        }}>
          <img
            src={src}
            alt={title || 'Evidência'}
            style={{
              maxWidth: '100%',
              borderRadius: 10,
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              display: 'block',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInRight { from { transform:translateX(100%) } to { transform:translateX(0) } }
      `}</style>
    </>
  )
}
