import { useState, useCallback } from 'react'
import { Plus, Eye, Zap, UserCheck, Search, X, Film, CheckSquare, Square } from 'lucide-react'
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

function StoryRow({ story, grupos, onEdit, isEditMode, selected, onToggleSelect }) {
  const [lightbox, setLightbox] = useState(false)
  return (
    <div
      onClick={() => onEdit(story)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid #F5F7FA',
        cursor: 'pointer', transition: 'background 0.1s',
        background: selected ? 'rgba(249,115,22,0.04)' : 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = selected ? 'rgba(249,115,22,0.06)' : '#FAFCFE' }}
      onMouseLeave={e => { e.currentTarget.style.background = selected ? 'rgba(249,115,22,0.04)' : 'transparent' }}
    >
      {/* Checkbox (edit mode) ou Dot (view mode) */}
      {isEditMode && onToggleSelect ? (
        <div
          onClick={e => { e.stopPropagation(); onToggleSelect(story.id) }}
          style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {selected
            ? <CheckSquare size={16} color="#F97316" />
            : <Square size={16} color="#D0D8E0" />
          }
        </div>
      ) : (
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#182638', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {story.nome || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ color: '#9AAAB8', fontSize: 11 }}>{story.data || '—'}</span>
          {Array.isArray(story.tema) && story.tema.slice(0, 2).map(t => (
            <span key={t} style={{ background: 'rgba(28,37,46,0.07)', color: '#4A6272', borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{t}</span>
          ))}
          {Array.isArray(story.tema) && story.tema.length > 2 && (
            <span style={{ color: '#9AAAB8', fontSize: 10 }}>+{story.tema.length - 2}</span>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div
        style={{ display: 'flex', gap: 20, flexShrink: 0 }}
        onClick={e => { if (isEditMode && onToggleSelect) { e.stopPropagation(); onEdit(story) } }}
      >
        <MetricBadge label="Visual." value={story.visualizacoes} color="#0891B2" />
        <MetricBadge label="Interações" value={story.interacoes} color="#F97316" />
        <MetricBadge label="Ativ. perfil" value={story.atividade_perfil} color="#059669" />
      </div>

      {lightbox && story.imageUrl && (
        <ImageLightbox src={story.imageUrl} title={story.nome || 'Story'} onClose={() => setLightbox(false)} />
      )}
    </div>
  )
}

function GrupoCard({ nome, stories, isEditMode, onEdit, selectedIds, onToggleSelect }) {
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
          <MetricBadge label="Ativ. perfil" value={total('atividade_perfil')} color="#059669" />
          {open ? <ChevronUp size={15} color="#9AAAB8" /> : <ChevronDown size={15} color="#9AAAB8" />}
        </div>
      </div>

      {/* Stories do grupo */}
      {open && stories.map(st => (
        <StoryRow key={st.id} story={st} isEditMode={isEditMode} onEdit={onEdit}
          selected={selectedIds?.has(st.id)} onToggleSelect={onToggleSelect} />
      ))}
    </div>
  )
}

export default function StoriesView() {
  const { stories, addStory, updateStory, deleteStory, isEditMode, syncError } = useStore()
  const [mesFiltro, setMesFiltro]   = useState(() => {
    const now = new Date()
    return `${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search, setSearch]         = useState('')
  const [temaFiltro, setTemaFiltro] = useState('')   // filtro por tema
  const [selected, setSelected]         = useState(new Set())
  const [editQueue, setEditQueue]       = useState([])
  const [editQueueTotal, setQueueTotal] = useState(0)

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const clearSelection = () => setSelected(new Set())
  const selectAll = (list) => setSelected(new Set(list.map(s => s.id)))

  function startMultiEdit() {
    const queue = sorted.filter(s => selected.has(s.id))
    if (queue.length === 0) return
    setEditQueue(queue)
    setQueueTotal(queue.length)
    setSelected(new Set())
  }

  function handleQueueSave(dados) {
    updateStory(editQueue[0].id, dados)
    setEditQueue(q => q.slice(1))
  }

  function handleQueueClose() {
    setEditQueue([])
    setQueueTotal(0)
  }

  // Temas disponíveis (dos stories existentes)
  const temasDisponiveis = [...new Set(
    stories.flatMap(s => Array.isArray(s.tema) ? s.tema : []).filter(Boolean)
  )].sort()

  // Filtra por mês, busca e tema
  const q = search.trim().toLowerCase()
  const filtered = stories.filter(s => {
    // Filtro de mês (ignorado se há busca de texto)
    if (!q) {
      if (!s.data) return false
      const [, mm, yyyy] = s.data.split('/')
      if (`${mm}/${yyyy}` !== mesFiltro) return false
    }
    // Filtro de texto
    if (q && !(
      (s.nome || '').toLowerCase().includes(q) ||
      (s.data || '').includes(q)
    )) return false
    // Filtro de tema
    if (temaFiltro && !(Array.isArray(s.tema) && s.tema.includes(temaFiltro))) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => parseDate(b.data) - parseDate(a.data))

  // KPIs (baseados nos stories filtrados)
  const kpiTotal   = (k) => sorted.reduce((s, st) => s + (st[k] || 0), 0)
  const totalViews = kpiTotal('visualizacoes')
  const totalInter = kpiTotal('interacoes')
  const totalPerf  = kpiTotal('atividade_perfil')

  const KPIS = [
    { label: 'Stories',          value: sorted.length, icon: Film,      color: '#1C252E', bg: 'rgba(28,37,46,0.08)' },
    { label: 'Visualizações',    value: totalViews,    icon: Eye,       color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
    { label: 'Interações',       value: totalInter,    icon: Zap,       color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Atividade perfil', value: totalPerf,     icon: UserCheck, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Erro de sincronização */}
      {syncError && syncError.includes('story') && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>{syncError}</p>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Stories</h2>
          <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Análise separada das metas de alcance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {MESES.map((m, i) => <option key={m} value={m}>{MESES_LABEL[i]} 2026</option>)}
          </select>
          {isEditMode && selected.size === 0 && sorted.length > 0 && (
            <button onClick={() => selectAll(sorted)} style={{
              background: '#F5F7FA', color: '#4A6272', border: '1.5px solid #EDEFF2', borderRadius: 10,
              padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <CheckSquare size={14} /> Selecionar
            </button>
          )}
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

      {/* Barra de filtros: label + tema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Label "Todos os stories" */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '6px 16px', border: '1.5px solid #EDEFF2', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#182638' }}>Todos os stories</span>
        </div>

        {/* Filtro por tema */}
        {temasDisponiveis.length > 0 && (
          <select
            value={temaFiltro}
            onChange={e => setTemaFiltro(e.target.value)}
            style={{
              background: temaFiltro ? '#1C252E' : '#fff',
              color: temaFiltro ? '#C3EBF7' : '#4A6272',
              border: `1.5px solid ${temaFiltro ? '#1C252E' : '#EDEFF2'}`,
              borderRadius: 10, padding: '6px 12px', fontSize: 13, fontWeight: temaFiltro ? 600 : 400,
              outline: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="">Todos os temas</option>
            {temasDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {temaFiltro && (
          <button onClick={() => setTemaFiltro('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#8A9BB0', fontSize: 12 }}>
            <X size={13} /> Limpar filtro
          </button>
        )}

        {/* Busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F7FA', borderRadius: 10, border: `1.5px solid ${q ? '#F97316' : '#EDEFF2'}`, padding: '6px 12px', flex: '1 1 160px', minWidth: 0 }}>
          <Search size={14} color={q ? '#F97316' : '#A8B5C0'} style={{ flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou data..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#182638', width: '100%', fontFamily: 'DM Sans, sans-serif' }} />
          {q && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} color="#A8B5C0" /></button>}
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#9AAAB8', fontSize: 13 }}>
              {temaFiltro ? `Nenhum story com tema "${temaFiltro}" neste período` : 'Nenhum story encontrado para este período'}
            </p>
            {isEditMode && !temaFiltro && (
              <button onClick={() => setUploadOpen(true)} style={{ marginTop: 12, background: '#F97316', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Adicionar primeiro story
              </button>
            )}
          </div>
        ) : sorted.map(st => (
          <StoryRow key={st.id} story={st} isEditMode={isEditMode} onEdit={setEditTarget}
            selected={selected.has(st.id)} onToggleSelect={isEditMode ? toggleSelect : null} />
        ))}
      </div>

      {/* Barra flutuante de seleção */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1C252E', borderRadius: 14, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)', zIndex: 500,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#C3EBF7', fontSize: 13, fontWeight: 600 }}>
            {selected.size} selecionado{selected.size > 1 ? 's' : ''}
          </span>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)' }} />
          <button onClick={startMultiEdit} style={{
            background: '#F97316', color: '#fff', border: 'none', borderRadius: 9,
            padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Editar {selected.size > 1 ? `${selected.size} stories` : 'story'}
          </button>
          <button onClick={clearSelection} style={{
            background: 'transparent', color: '#8A9BB0', border: 'none',
            cursor: 'pointer', padding: '4px', display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modais */}
      {uploadOpen && (
        <StoryUploadModal
          mode="new"
          onClose={() => setUploadOpen(false)}
          onSave={dados => { addStory(dados) }}
        />
      )}
      {editTarget && (
        <StoryUploadModal
          mode="update"
          story={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={dados => { updateStory(editTarget.id, dados); setEditTarget(null) }}
          onDelete={() => { deleteStory(editTarget.id); setEditTarget(null) }}
        />
      )}

      {/* Modal de edição sequencial */}
      {editQueue.length > 0 && (
        <StoryUploadModal
          key={editQueue[0].id}
          mode="update"
          story={editQueue[0]}
          queueIdx={editQueueTotal - editQueue.length}
          queueTotal={editQueueTotal}
          onClose={handleQueueClose}
          onSave={handleQueueSave}
          onDelete={() => { deleteStory(editQueue[0].id); setEditQueue(q => q.slice(1)) }}
        />
      )}
    </div>
  )
}
