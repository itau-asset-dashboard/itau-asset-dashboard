import { BarChart2, Calendar, List, Lightbulb, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'

function InstagramIcon({ size = 14, color = '#1C252E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none"/>
    </svg>
  )
}

const nav = [
  { id: 'visao-anual',  icon: Calendar,  label: 'Visão Anual' },
  { id: 'visao-geral',  icon: BarChart2, label: 'Visão Mensal' },
  { id: 'posts',        icon: List,      label: 'Todos os Posts' },
  { id: 'insights',     icon: Lightbulb, label: 'Insights' },
  { id: 'upload',       icon: Upload,    label: 'Upload' },
]

// Logo Itaú como SVG inline
function ItauLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#1C252E"/>
      <text x="50%" y="64" textAnchor="middle" fontFamily="Arial, sans-serif"
        fontWeight="700" fontSize="36" fill="#C3EBF7" letterSpacing="-1">
        itaú
      </text>
    </svg>
  )
}

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore()

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="sidebar-desktop" style={{
        width: 220,
        height: '100%',
        background: '#C3EBF7',
        borderRight: '1px solid #A8D8EF',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo + perfil */}
        <div style={{ marginBottom: 28, padding: '0 4px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <ItauLogo size={40} />
            <div>
              <p style={{ color: '#1C252E', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Itaú Asset</p>
              <p style={{ color: '#4A7A95', fontSize: 11, fontWeight: 500 }}>Management</p>
            </div>
          </div>

          {/* Card perfil Instagram */}
          <div style={{
            background: 'rgba(28,37,46,0.07)', borderRadius: 12,
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {/* Avatar placeholder */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #f9a825, #e91e63, #9c27b0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>IA</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <InstagramIcon size={12} color="#1C252E" />
                <span style={{ color: '#1C252E', fontSize: 12, fontWeight: 700 }}>@itauasset</span>
              </div>
              <p style={{ color: '#4A7A95', fontSize: 10 }}>Instagram Analytics</p>
            </div>
          </div>
        </div>

        {/* Label menu */}
        <p style={{ color: '#4A7A95', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 6 }}>
          Menu
        </p>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {nav.map(({ id, icon: Icon, label }) => {
            const active = activeSection === id
            return (
              <button key={id} onClick={() => setActiveSection(id)}
                style={{
                  width: '100%', borderRadius: 10, padding: '9px 10px',
                  background: active ? '#1C252E' : 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(28,37,46,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={16} color={active ? '#C3EBF7' : '#1C252E'} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ color: active ? '#C3EBF7' : '#1C252E', fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#C3EBF7' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Versão */}
        <p style={{ color: '#7AABB8', fontSize: 10, textAlign: 'center', padding: '8px 0 2px' }}>
          v1.0 · Itaú Asset © 2026
        </p>
      </aside>

      {/* ── Bottom nav mobile ── */}
      <nav className="bottom-nav">
        {nav.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id
          return (
            <button key={id} onClick={() => setActiveSection(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, background: 'none', border: 'none',
                cursor: 'pointer', padding: '6px 2px',
              }}>
              <Icon size={19} color={active ? '#C3EBF7' : '#4A6272'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 9, color: active ? '#C3EBF7' : '#8AAAB8', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
