import { BarChart2, Calendar, List, Lightbulb, Upload, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore'

const nav = [
  { id: 'visao-anual',  icon: Calendar,  label: 'Visão Anual' },
  { id: 'visao-geral',  icon: BarChart2, label: 'Visão Mensal' },
  { id: 'posts',        icon: List,      label: 'Todos os Posts' },
  { id: 'insights',     icon: Lightbulb, label: 'Insights' },
  { id: 'etfs',         icon: TrendingUp, label: 'ETFs' },
  { id: 'upload',       icon: Upload,    label: 'Upload' },
]

function InstagramIcon({ size = 13, color = '#1C252E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="6"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none"/>
    </svg>
  )
}

// Logo Itaú Asset — fiel ao logo oficial
function ItauLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Superelipse com bordas bem arredondadas como no logo oficial */}
      <path d="M50,4 C74,4 96,26 96,50 C96,74 74,96 50,96 C26,96 4,74 4,50 C4,26 26,4 50,4 Z" fill="none"/>
      <rect width="100" height="100" rx="30" fill="#1C252E"/>
      <text x="50" y="66" textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900" fontSize="33" fill="#C3EBF7" letterSpacing="-1">
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
        width: 216,
        height: '100%',
        background: 'rgba(195,235,247,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(168,216,239,0.6)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 10px 14px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* ── Cabeçalho ── */}
        <div style={{ padding: '0 6px', marginBottom: 24 }}>

          {/* Logo + nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
            <ItauLogo size={44} />
            <div>
              <p style={{ color: '#1C252E', fontWeight: 800, fontSize: 15, lineHeight: 1.15 }}>Itaú Asset</p>
              <p style={{ color: '#3A7A95', fontSize: 11, fontWeight: 500, marginTop: 1 }}>Management</p>
            </div>
          </div>

          {/* Pill @itauasset */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(28,37,46,0.09)',
            borderRadius: 20, padding: '5px 11px',
          }}>
            <InstagramIcon size={12} color="#1C252E" />
            <span style={{ color: '#1C252E', fontSize: 11, fontWeight: 700, letterSpacing: '0.01em' }}>
              @itauasset
            </span>
          </div>
        </div>

        {/* ── Divisor ── */}
        <div style={{ height: 1, background: 'rgba(28,37,46,0.08)', marginBottom: 14, marginLeft: 6, marginRight: 6 }}/>

        {/* ── Nav ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {nav.map(({ id, icon: Icon, label }) => {
            const active = activeSection === id
            return (
              <button key={id} onClick={() => setActiveSection(id)}
                style={{
                  width: '100%', borderRadius: 14, padding: '9px 11px',
                  background: active ? '#1C252E' : 'transparent',
                  border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(28,37,46,0.08)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  background: active ? 'rgba(195,235,247,0.15)' : 'rgba(28,37,46,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={active ? '#C3EBF7' : '#1C252E'} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span style={{ color: active ? '#C3EBF7' : '#1C252E', fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#C3EBF7' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Rodapé ── */}
        <p style={{ color: 'rgba(28,37,46,0.3)', fontSize: 10, textAlign: 'center', paddingTop: 8 }}>
          Itaú Asset © 2026
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
