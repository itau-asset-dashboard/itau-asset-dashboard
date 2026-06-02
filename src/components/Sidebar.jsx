import { BarChart2, Calendar, List, Lightbulb, Upload, TrendingUp, LineChart, RefreshCw } from 'lucide-react'
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

function ItauLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#182638"/>
      <text x="50" y="66" textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900" fontSize="33" fill="#C3EBF7" letterSpacing="-1">
        itaú
      </text>
    </svg>
  )
}

function SyncWidget() {
  const { syncing, syncError, syncFromCloud } = useStore()

  const dot = syncError
    ? { color: '#ef4444', label: 'Erro de conexão' }
    : syncing
    ? { color: '#F59E0B', label: 'Sincronizando…' }
    : { color: '#22C55E', label: 'Sincronizado' }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #EDEFF2',
      borderRadius: 12,
      padding: '12px 14px',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#1C252E', fontSize: 12, fontWeight: 600 }}>Instagram API</span>
        <button onClick={syncFromCloud} title="Atualizar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#8A9BB0', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={11} color="#C0CAD4" />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: dot.color, flexShrink: 0,
          boxShadow: `0 0 0 2px ${dot.color}22`,
        }} />
        <span style={{ color: dot.color === '#22C55E' ? '#16A34A' : dot.color, fontSize: 12, fontWeight: 500 }}>
          {dot.label}
        </span>
      </div>
      {!syncError && !syncing && (
        <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 5 }}>Última atualização: agora</p>
      )}
    </div>
  )
}

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
        padding: '18px 10px 14px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* ── Brand card ── */}
        <div style={{
          background: '#fff',
          border: '1px solid #EDEFF2',
          borderRadius: 14,
          padding: '14px 14px 12px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <ItauLogo size={36} />
            <div>
              <p style={{ color: '#182638', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Itaú Asset</p>
              <p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 400, marginTop: 1 }}>Instagram Analytics</p>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F0F4F8', borderRadius: 20, padding: '4px 10px',
          }}>
            <InstagramIcon size={11} color="#5A6A7A" />
            <span style={{ color: '#5A6A7A', fontSize: 11, fontWeight: 600 }}>@itauasset</span>
          </div>
        </div>

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
                        background: active ? '#FFF4EE' : 'transparent',
                        border: 'none',
                        borderLeft: `2.5px solid ${active ? '#FF6B00' : 'transparent'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'background 0.1s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#EDEEF0' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <Icon
                        size={14}
                        color={active ? '#FF6B00' : '#5A6A7A'}
                        strokeWidth={active ? 2.3 : 1.8}
                      />
                      <span style={{
                        color: active ? '#FF6B00' : '#3D4E5C',
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

        {/* ── Sync widget ── */}
        <SyncWidget />
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
              <Icon size={19} color={active ? '#FF6B00' : '#4A6272'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 9, color: active ? '#FF6B00' : '#8AAAB8', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
