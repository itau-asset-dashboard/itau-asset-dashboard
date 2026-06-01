import { BarChart2, Calendar, List, Lightbulb, Upload, Settings, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore'

const nav = [
  { id: 'visao-anual',  icon: Calendar,   label: 'Visão Anual' },
  { id: 'visao-geral',  icon: BarChart2,  label: 'Visão Mensal' },
  { id: 'posts',        icon: List,       label: 'Todos os Posts' },
  { id: 'insights',     icon: Lightbulb,  label: 'Insights' },
  { id: 'upload',       icon: Upload,     label: 'Upload' },
]

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore()

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="sidebar-desktop" style={{
        width: 220,
        height: '100%',
        background: '#1C252E',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <div style={{
            width: 36, height: 36, background: '#FF6200', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255,98,0,0.3)',
          }}>
            <TrendingUp size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Itaú Asset</p>
            <p style={{ color: '#4A6272', fontSize: 11 }}>Instagram Analytics</p>
          </div>
        </div>

        {/* Label menu */}
        <p style={{ color: '#4A6272', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 6 }}>
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
                  background: active ? 'rgba(195,235,247,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(195,235,247,0.15)' : '1px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                <Icon size={16} color={active ? '#C3EBF7' : '#4A6272'} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ color: active ? '#C3EBF7' : '#7A8E9A', fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#C3EBF7' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Settings */}
        <button style={{
          width: '100%', borderRadius: 10, padding: '9px 10px',
          background: 'transparent', border: '1px solid transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Settings size={16} color="#4A6272" strokeWidth={1.8} />
          <span style={{ color: '#7A8E9A', fontSize: 13 }}>Configurações</span>
        </button>
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
              <span style={{ fontSize: 9, color: active ? '#C3EBF7' : '#4A6272', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
