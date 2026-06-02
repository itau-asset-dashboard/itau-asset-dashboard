import { BarChart2, Calendar, List, Lightbulb, Upload, TrendingUp, LineChart } from 'lucide-react'
import { useStore } from '../store/useStore'

// ANÁLISE primeiro, depois CONTEÚDO, depois PRODUTOS
const NAV_GROUPS = [
  {
    label: 'ANÁLISE',
    items: [
      { id: 'visao-anual', icon: Calendar,  label: 'Visão Anual' },
      { id: 'visao-geral', icon: BarChart2, label: 'Visão Mensal' },
      { id: 'insights',    icon: Lightbulb, label: 'Insights' },
    ],
  },
  {
    label: 'CONTEÚDO',
    items: [
      { id: 'posts',  icon: List,    label: 'Todos os Posts' },
      { id: 'upload', icon: Upload,  label: 'Upload' },
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

const NAV_FLAT = NAV_GROUPS.flatMap(g => g.items)

function InstagramIcon({ size = 12, color = '#5A6A7A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="6"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none"/>
    </svg>
  )
}

// Logo fiel ao Itaú — superelipse escura, tipografia rounded
function ItauLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Superelipse com cantos muito arredondados */}
      <rect width="200" height="200" rx="52" fill="#182638"/>
      {/* "itaú" com fonte arredondada aproximada */}
      <text x="100" y="132" textAnchor="middle"
        fontFamily="'DM Sans', Arial Rounded MT Bold, Arial, sans-serif"
        fontWeight="700" fontSize="72" fill="#C3EBF7" letterSpacing="-2">
        itaú
      </text>
    </svg>
  )
}

// Laranja Itaú suavizado — menos vermelho, mais âmbar
const ORANGE = '#F97316'
const ORANGE_BG = '#FFF7F0'

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore()

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="sidebar-desktop" style={{
        width: 192,
        height: '100%',
        background: '#F8F9FA',
        borderRight: '1px solid #EDEFF2',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 10px 16px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* ── Topo: logo + badge ── */}
        <div style={{ padding: '0 4px', marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <ItauLogo size={40} />
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#EDEFF2', borderRadius: 20, padding: '5px 11px',
          }}>
            <InstagramIcon size={11} color="#5A6A7A" />
            <span style={{ color: '#3D4E5C', fontSize: 11, fontWeight: 600 }}>@itauasset</span>
          </div>
        </div>

        {/* ── Divisor ── */}
        <div style={{ height: 1, background: '#EDEFF2', marginBottom: 18, marginLeft: 4, marginRight: 4 }} />

        {/* ── Nav por grupos ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p style={{
                color: '#A8B5C0', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                padding: '0 8px', marginBottom: 4,
              }}>
                {label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map(({ id, icon: Icon, label: itemLabel }) => {
                  const active = activeSection === id
                  return (
                    <button key={id} onClick={() => setActiveSection(id)}
                      style={{
                        width: '100%', borderRadius: 9, padding: '7px 8px 7px 10px',
                        background: active ? ORANGE_BG : 'transparent',
                        border: 'none',
                        borderLeft: `2.5px solid ${active ? ORANGE : 'transparent'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'background 0.1s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#EDEEF0' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <Icon
                        size={14}
                        color={active ? ORANGE : '#5A6A7A'}
                        strokeWidth={active ? 2.3 : 1.8}
                      />
                      <span style={{
                        color: active ? ORANGE : '#3D4E5C',
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        letterSpacing: '-0.01em',
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

        {/* ── Rodapé ── */}
        <p style={{ color: '#C8D2DA', fontSize: 10, textAlign: 'center', paddingTop: 10 }}>
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
              <Icon size={19} color={active ? ORANGE : '#4A6272'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 9, color: active ? ORANGE : '#8AAAB8', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
