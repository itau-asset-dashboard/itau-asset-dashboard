import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function ImageLightbox({ src, onClose, title }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!src) return null

  function handleDownload() {
    if (src.startsWith('http')) { window.open(src, '_blank'); return }
    const a = document.createElement('a')
    a.href = src
    a.download = title ? `${title}.jpg` : 'evidencia.jpg'
    a.click()
  }

  return (
    <>
      {/* Overlay — clica fora para fechar */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,15,25,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          animation: 'lbFadeIn 0.18s ease',
        }}
      >
        {/* Container da imagem — impede propagação do clique */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: '92vw',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'lbScaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Barra de ações */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px 12px 0 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}>
            <div>
              <p style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
                {title || 'Evidência'}
              </p>
              <p style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>
                Imagem original · clique fora ou Esc para fechar
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleDownload} title="Baixar"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <Download size={14} color="#94A3B8" />
              </button>
              <button onClick={onClose} title="Fechar (Esc)"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <X size={14} color="#94A3B8" />
              </button>
            </div>
          </div>

          {/* Imagem — respeita qualquer aspect ratio */}
          <img
            src={src}
            alt={title || 'Evidência'}
            style={{
              display: 'block',
              maxWidth: '92vw',
              maxHeight: 'calc(88vh - 60px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '0 0 12px 12px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes lbFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes lbScaleIn { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </>
  )
}
