import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Eye, Users, Zap, UserCheck, Search, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import StoryUploadModal from './StoryUploadModal'
import ImageLightbox from './ImageLightbox'

function fmt(n) {
  if (n == null || n === 0) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'K'
  return n.toLocaleString('pt-BR')
}

function parseDate(d) {
  if (!d) return 0
  const [dd, mm, yyyy] = d.split('/')
  return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
}

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES = Array.from({ length: 12 }, (_, i) => `${String(i+1).padStart(2,'0')}/2026`)

function MetricBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ color: '#9AAAB8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ color: color || '#182638', fontSize: 14, fontWeight: 700 }}>{fmt(value)}</span>
    </div>
  )
}

function StoryRow({ story, grupos, onEdit, isEditMode }) {
  const [lightbox, setLightbox] = useState(false)
  return (
    <div
      onClick={() => isEditMode && onEdit(story)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid #F5F7FA',
        cursor: isEditMode ? 'pointer' : 'default', transition: 'background 0.1s',
      }}
      onMouseEnter={e => isEditMode && (e.currentTarget.style.background = '#FAFCFE')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumbnail */}
      <div
        onClick={e => { e.stopPropagation(); if (story.imageUrl || story.imageData) setLightbox(true) }}
        style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: '#F0F4F8', overflow: 'hidden',
          border: '1.5px solid #E8ECF0',
          cursor: story.imageUrl || story.imageData ? 'zoom-in' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {story.imageUrl || story.imageData
          ? <img src={story.imageUrl || story.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Eye size={14} color="#C3D0DA" />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#182638', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {story.nome || '—'}
        </p>
        <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 1 }}>{story.data || '—'}</p>
      </div>

      {/* Métricas */}
      <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
        <MetricBadge label="Visual." value={story.visualizacoes} color="#0891B2" />
        <MetricBadge label="Interações" value={story.interacoes} color="#F97316" />
        <MetricBadge label="Alcance" value={story.contas_alcancadas} color="#7C3AED" />
      </div>

      {lightbox && (story.imageUrl || story.imageData) && (
        <ImageLightbox src={story.imageUrl || story.imageData} title={story.nome || 'Story'} onClose={() => setLightbox(false)} />
      )}
    </div>
  )
}

function GrupoCard({ nome, stories, isEditMode, onEdit }) {
  const [open, setOpen] = useState(false)
  const total = (k) => stories.reduce((s, st) => s + (st[k] || 0), 0)

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
      {/* Header do grupo */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#FAFBFC' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#182638', fontSize: 13, fontWeight: 700 }}>{nome}</p>
            <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 1 }}>{stories.length} story{stories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <MetricBadge label="Visual." value={total('visualizacoes')} color="#0891B2" />
          <MetricBadge label="Interações" value={total('interacoes')} color="#F97316" />
          <MetricBadge label="Alcance" value={total('contas_alcancadas')} color="#7C3AED" />
          {open ? <ChevronUp size={15} color="#9AAAB8" /> : <ChevronDown size={15} color="#9AAAB8" />}
        </div>
      </div>

      {/* Stories do grupo */}
      {open && stories.map(st => (
        <StoryRow key={st.id} story={st} isEditMode={isEditMode} onEdit={onEdit} />
      ))}
    </div>
  )
}

export default function StoriesView() {
  const { stories, addStory, updateStory, deleteStory, isEditMode } = useStore()
  const [tab, setTab]               = useState('todos') // 'todos' | 'grupos'
  const [mesFiltro, setMesFiltro]   = useState(() => {
    const now = new Date()
    return `${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search, setSearch]         = useState('')

  // Filtra por mês ou busca
  const q = search.trim().toLowerCase()
  const filtered = q
    ? stories.filter(s =>
        (s.nome || '').toLowerCase().includes(q) ||
        (s.data || '').includes(q) ||
        (s.grupo || '').toLowerCase().includes(q)
      )
    : stories.filter(s => {
        if (!s.data) return false
        const [, mm, yyyy] = s.data.split('/')
        return `${mm}/${yyyy}` === mesFiltro
      })

  const sorted = [...filtered].sort((a, b) => parseDate(b.data) - parseDate(a.data))

  // KPIs
  const kpiTotal    = (k) => sorted.reduce((s, st) => s + (st[k] || 0), 0)
  const totalViews  = kpiTotal('visualizacoes')
  const totalInter  = kpiTotal('interacoes')
  const totalAlc    = kpiTotal('contas_alcancadas')
  const totalPerf   = kpiTotal('atividade_perfil')

  // Grupos
  const gruposNomes = [...new Set(stories.filter(s => s.grupo).map(s => s.grupo))].sort()
  const gruposFiltrados = gruposNomes.map(g => ({
    nome: g,
    stories: sorted.filter(s => s.grupo === g),
  })).filter(g => g.stories.length > 0)
  const soltos = sorted.filter(s => !s.grupo)

  const KPIS = [
    { label: 'Visualizações',    value: totalViews, icon: Eye,       color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
    { label: 'Alcance',          value: totalAlc,   icon: Users,     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    { label: 'Interações',       value: totalInter, icon: Zap,       color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Atividade perfil', value: totalPerf,  icon: UserCheck, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Stories</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Análise separada das metas de alcance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {MESES.map((m, i) => <option key={m} value={m}>{MESES_LABEL[i]} 2026</option>)}
          </select>
          {isEditMode && (
            <button onClick={() => setUploadOpen(true)} style={{
              background: '#F97316', color: '#fff', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Plus size={15} /> Novo story
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }} className="kpi-grid">
        {KPIS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card kpi-card" style={{ padding: '14px 16px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <p style={{ color: '#182638', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#F4F6F8', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'todos', label: 'Todos os stories' }, { id: 'grupos', label: 'Grupos' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#182638' : '#8A9BB0',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F7FA', borderRadius: 10, border: `1.5px solid ${q ? '#F97316' : '#EDEFF2'}`, padding: '7px 12px', maxWidth: 320 }}>
        <Search size={14} color={q ? '#F97316' : '#A8B5C0'} style={{ flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, data, grupo..."
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#182638', width: '100%', fontFamily: 'DM Sans, sans-serif' }} />
        {q && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} color="#A8B5C0" /></button>}
      </div>

      {/* Conteúdo */}
      {tab === 'todos' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: '#9AAAB8', fontSize: 13 }}>Nenhum story encontrado para este período</p>
              {isEditMode && <button onClick={() => setUploadOpen(true)} style={{ marginTop: 12, background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Adicionar primeiro story</button>}
            </div>
          ) : sorted.map(st => (
            <StoryRow key={st.id} story={st} isEditMode={isEditMode} onEdit={setEditTarget} />
          ))}
        </div>
      )}

      {tab === 'grupos' && (
        <div>
          {gruposFiltrados.length === 0 && soltos.length === 0 && (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: '#9AAAB8', fontSize: 13 }}>Nenhum story com grupo neste período</p>
            </div>
          )}
          {gruposFiltrados.map(g => (
            <GrupoCard key={g.nome} nome={g.nome} stories={g.stories} isEditMode={isEditMode} onEdit={setEditTarget} />
          ))}
          {soltos.length > 0 && (
            <div>
              <p style={{ color: '#9AAAB8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: gruposFiltrados.length > 0 ? 16 : 0 }}>Stories soltos</p>
              <div className="card" style={{ overflow: 'hidden' }}>
                {soltos.map(st => (
                  <StoryRow key={st.id} story={st} isEditMode={isEditMode} onEdit={setEditTarget} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {uploadOpen && (
        <StoryUploadModal
          mode="new"
          grupos={gruposNomes}
          onClose={() => setUploadOpen(false)}
          onSave={dados => { addStory(dados); setUploadOpen(false) }}
        />
      )}
      {editTarget && (
        <StoryUploadModal
          mode="update"
          story={editTarget}
          grupos={gruposNomes}
          onClose={() => setEditTarget(null)}
          onSave={dados => { updateStory(editTarget.id, dados); setEditTarget(null) }}
          onDelete={() => { deleteStory(editTarget.id); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
