import { BarChart2, Calendar, List, Lightbulb, Upload, Settings } from 'lucide-react'
import { useStore } from '../store/useStore'

const nav = [
  { id: 'visao-geral',  icon: BarChart2, label: 'Visão Mensal' },
  { id: 'visao-anual',  icon: Calendar,  label: 'Visão Anual' },
  { id: 'posts',        icon: List,      label: 'Todos os Posts' },
  { id: 'insights',     icon: Lightbulb, label: 'Insights' },
  { id: 'upload',       icon: Upload,    label: 'Upload' },
]

export default function Sidebar() {
  const { activeSection, setActiveSection } = useStore()

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="sidebar-desktop" style={{
        background: '#1C252E',
        width: 68,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          width: 38, height: 38,
          background: '#FF6200',
          borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, flexShrink: 0,
          boxShadow: '0 4px 12px rgba(255,98,0,0.35)',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>IA</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {nav.map(({ id, icon: Icon, label }) => {
            const active = activeSection === id
            return (
              <button key={id} onClick={() => setActiveSection(id)} title={label}
                style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: active ? 'rgba(195,235,247,0.13)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s', position: 'relative',
                }}>
                {active && (
                  <div style={{
                    position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, background: '#C3EBF7', borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={18} color={active ? '#C3EBF7' : '#4A5568'} strokeWidth={active ? 2.2 : 1.8} />
              </button>
            )
          })}
        </nav>

        <button title="Configurações" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          width: 46, height: 46, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Settings size={17} color="#4A5568" strokeWidth={1.8} />
        </button>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="bottom-nav">
        {nav.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id
          return (
            <button key={id} onClick={() => setActiveSection(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, background: 'none', border: 'none',
                cursor: 'pointer', padding: '6px 0',
              }}>
              <Icon size={20} color={active ? '#C3EBF7' : '#4A5568'} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 9, color: active ? '#C3EBF7' : '#4A5568', fontWeight: active ? 700 : 400 }}>
                {label.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
