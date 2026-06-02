import { BarChart2, Calendar, List, Lightbulb, Upload, TrendingUp, LineChart } from 'lucide-react'
import { useStore } from '../store/useStore'

const NAV_GROUPS = [
  {
    label: 'CONTEÚDO',
    items: [
      { id: 'posts',  icon: List,    label: 'Todos os Posts' },
      { id: 'upload', icon: Upload,  label: 'Upload' },
    ],
  },
  {
    label: 'ANÁLISE',
    items: [
      { id: 'visao-anual', icon: Calendar,  label: 'Visão Anual' },
      { id: 'visao-geral', icon: BarChart2, label: 'Visão Mensal' },
      { id: 'insights',    icon: Lightbulb, label: 'Insights' },
    ],
  },
  {
    label: 'PRODUTOS',
    items: [
      { id: 'etfs',   icon: TrendingUp, label: 'ETFs' },
      { id: 'oliver', icon: LineChart,  label: 'Dados Oliver' },
    ],
  },
]

// Lista plana para o bottom nav mobile
const NAV_FLAT = NAV_GROUPS.flatMap(g => g.items)

function InstagramIcon({ size = 12, color = '#4A5568' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="6"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none"/>
    </svg>
  )
}

function ItauLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#1C252E"/>
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
        width: 220,
        height: '100%',
        background: '#F8F9FA',
        borderRight: '1px solid #EDEFF2',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px 16px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* Logo + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', marginBottom: 18 }}>
          <ItauLogo size={40} />
          <p style={{ color: '#1C252E', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Itaú Asset</p>
        </div>

        {/* @itauasset badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#EDEFF2', borderRadius: 20, padding: '6px 12px',
          marginBottom: 24, alignSelf: 'flex-start',
        }}>
          <InstagramIcon size={12} color="#4A5568" />
          <span style={{ color: '#4A5568', fontSize: 11, fontWeight: 700, letterSpacing: '0.01em' }}>
            @itauasset
          </span>
        </div>

        {/* Nav por grupos */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p style={{
                color: '#8A9BB0', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '0 8px', marginBottom: 4,
              }}>
                {label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(({ id, icon: Icon, label: itemLabel }) => {
                  const active = activeSection === id
                  return (
                    <button key={id} onClick={() => setActiveSection(id)}
                      style={{
                        width: '100%', borderRadius: 10, padding: '8px 10px',
                        background: active ? '#FFF4EE' : 'transparent',
                        border: 'none',
                        borderLeft: `3px solid ${active ? '#FF6200' : 'transparent'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                        transition: 'background 0.12s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F0F2F5' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <Icon size={15} color={active ? '#FF6200' : '#4A5568'} strokeWidth={active ? 2.2 : 1.8} />
                      <span style={{
                        color: active ? '#FF6200' : '#4A5568',
                        fontSize: 13, fontWeight: active ? 700 : 400,
                      }}>
                        {itemLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé */}
        <p style={{ color: '#C0CAD4', fontSize: 10, textAlign: 'center', paddingTop: 8 }}>
          Itaú Asset © 2026
        </p>
      </aside>

      {/* ── Bottom nav mobile ── */}
      <nav className="bottom-nav">
        {NAV_FLAT.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id
          return (
            <button key={id} onClick={() => setActiveSection(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, background: 'none', border: 'none',
                cursor: 'pointer', padding: '6px 2px',
              }}>
              <Icon size={19} color={active ? '#FF6200' : '#4A6272'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 9, color: active ? '#FF6200' : '#8AAAB8', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
