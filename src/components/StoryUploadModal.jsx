import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { X, Upload, Sparkles, Check, Trash2, ChevronRight } from 'lucide-react'
import { extractStoryFromImage } from '../utils/anthropic'
import { useStore } from '../store/useStore'
import ImageLightbox from './ImageLightbox'
import { TEMAS } from './UploadModal'

const NUM_FIELDS = [
  { key: 'visualizacoes',    label: 'Visualizações',        highlight: true },
  { key: 'interacoes',       label: 'Interações',           highlight: false },
  { key: 'atividade_perfil', label: 'Atividade do perfil',  highlight: false },
]

const EMPTY = {
  nome: '', data: '', tema: [],
  visualizacoes: '', contas_alcancadas: '', interacoes: '',
  atividade_perfil: '', respostas: '', toques_avancar: '',
  toques_retroceder: '', saidas: '',
  status: 'final', imageData: null,
}

async function compressImage(dataUrl, maxPx = 1400, quality = 0.90) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(dataUrl), 8000)
    const img = new Image()
    img.onload = () => {
      clearTimeout(timer)
      try {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (_) { resolve(dataUrl) }
    }
    img.onerror = () => { clearTimeout(timer); resolve(dataUrl) }
    img.src = dataUrl
  })
}

const inp = (highlight) => ({
  width: '100%',
  border: `1.5px solid ${highlight ? 'rgba(195,235,247,0.9)' : '#E8ECF0'}`,
  borderRadius: 9, padding: '8px 12px', fontSize: 13,
  outline: 'none', color: '#1C252E', fontFamily: 'DM Sans, sans-serif',
  background: highlight ? 'rgba(195,235,247,0.06)' : '#fff',
})

// ─── Formulário de um story ──────────────────────────────────────────────────
const SingleStoryForm = forwardRef(function SingleStoryForm(
  { initialPost, initialPreview, onClose, onSave, isLast, currentIdx, totalFiles }, ref
) {
  const { apiKey } = useStore()
  const [preview, setPreview]     = useState(initialPreview || initialPost?.imageData || null)
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const [dragging, setDragging]   = useState(false)
  const [lightbox, setLightbox]   = useState(false)
  const [form, setFormState]      = useState(() => ({ ...EMPTY, ...initialPost }))

  useImperativeHandle(ref, () => ({ getSnapshot: () => ({ form, preview }) }))

  function set(k, v) { setFormState(f => ({ ...f, [k]: v })) }

  function handleFile(file) {
    if (!file) return
    const r = new FileReader()
    r.onload = e => { setPreview(e.target.result); setError(null) }
    r.readAsDataURL(file)
  }

  async function extract() {
    if (!preview || !apiKey) { setError('Configure a chave da API Anthropic.'); return }
    setLoading(true); setError(null)
    try {
      const [hdr, b64] = preview.split(',')
      const mt = hdr.match(/:(.*?);/)?.[1] || 'image/jpeg'
      const data = await extractStoryFromImage(b64, mt, apiKey)
      setFormState(f => ({
        ...f,
        data:              data.data              ?? f.data,
        visualizacoes:     data.visualizacoes     ?? f.visualizacoes,
        contas_alcancadas: data.contas_alcancadas ?? f.contas_alcancadas,
        interacoes:        data.interacoes        ?? f.interacoes,
        atividade_perfil:  data.atividade_perfil  ?? f.atividade_perfil,
        respostas:         data.respostas         ?? f.respostas,
        toques_avancar:    data.toques_avancar    ?? f.toques_avancar,
        toques_retroceder: data.toques_retroceder ?? f.toques_retroceder,
        saidas:            data.saidas            ?? f.saidas,
      }))
    } catch (e) { setError('Não foi possível extrair: ' + e.message) }
    finally { setLoading(false) }
  }

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      const compressed = preview ? await compressImage(preview) : form.imageData
      const dados = {
        ...form,
        imageData: compressed,
        imagePreview: preview || null,
        ...Object.fromEntries(NUM_FIELDS.map(({ key }) => [key, Number(form[key]) || null])),
      }
      onSave(dados)
      setSaved(true)
      setSaving(false)
      setTimeout(() => setSaved(false), 1000)
    } catch (_) { setSaving(false); setError('Erro ao salvar.') }
  }

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Contador */}
      {totalFiles > 1 && (
        <div style={{ background: '#F5F8FA', borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8A9BB0', fontSize: 12 }}>Story {currentIdx + 1} de {totalFiles}</span>
          <span style={{ color: isLast ? '#16a34a' : '#FF6200', fontSize: 11, fontWeight: 600 }}>
            {isLast ? '✓ Último' : `Faltam ${totalFiles - currentIdx - 1}`}
          </span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('_story_inp_single').click()}
        style={{ border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`, borderRadius: 12, padding: preview ? '10px 14px' : '20px 14px', cursor: 'pointer', background: dragging ? '#F0F8FF' : '#FAFCFE', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <input id="_story_inp_single" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <>
            <img src={preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'zoom-in', border: '1.5px solid #E8ECF0' }} onClick={e => { e.stopPropagation(); setLightbox(true) }} />
            <div style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
              <p style={{ color: '#1C252E', fontWeight: 700, fontSize: 13 }}>Print do story</p>
              <span style={{ color: '#1C252E', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setLightbox(true) }}>ver imagem ↗</span>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); setPreview(null) }} style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #fecaca', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={13} color="#ef4444" />
            </button>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <Upload size={22} color="#C3EBF7" style={{ margin: '0 auto 6px' }} />
            <p style={{ color: '#8A9BB0', fontSize: 13 }}>Arraste o print ou clique para selecionar</p>
          </div>
        )}
      </div>

      {/* Extrair */}
      {preview && (
        <button onClick={extract} disabled={loading} style={{ background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: loading ? 0.75 : 1, width: '100%' }}>
          <Sparkles size={14} />{loading ? 'Extraindo...' : 'Extrair métricas automaticamente'}
        </button>
      )}

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px' }}><p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p></div>}

      {/* Nome */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nome / descrição</label>
        <input value={form.nome || ''} onChange={e => set('nome', e.target.value)} placeholder="Ex: Cobertura ETF Day — dia 1" style={inp(false)} />
      </div>

      {/* Tema — pills multi-select */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tema
        </label>
        {form.tema?.length > 0 && (
          <p style={{ color: '#1C252E', fontSize: 11, marginBottom: 6 }}>
            {form.tema.length} selecionado{form.tema.length > 1 ? 's' : ''}: {form.tema.join(' · ')}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMAS.map(t => {
            const sel = Array.isArray(form.tema) && form.tema.includes(t)
            return (
              <button key={t} type="button"
                onClick={() => set('tema', sel ? form.tema.filter(x => x !== t) : [...(form.tema || []), t])}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: sel ? 700 : 400,
                  background: sel ? '#1C252E' : '#F0F4F8',
                  color: sel ? '#C3EBF7' : '#4A6272',
                  border: sel ? '1.5px solid #1C252E' : '1.5px solid #E0E7EF',
                  transition: 'all 0.12s',
                }}>
                {sel && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Data */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</label>
        <input value={form.data || ''} onChange={e => set('data', e.target.value)} placeholder="DD/MM/AAAA" style={inp(false)} />
      </div>


      {/* Métricas */}
      <div>
        <p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Métricas</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {NUM_FIELDS.map(({ key, label, highlight }) => (
            <div key={key} style={highlight ? { gridColumn: '1 / -1' } : {}}>
              <label style={{ color: highlight ? '#1a7a96' : '#8A9BB0', fontSize: 11, fontWeight: highlight ? 700 : 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
              <input type="number" value={form[key] === null || form[key] === undefined ? '' : form[key]} onChange={e => set(key, e.target.value)} placeholder="—" style={{ ...inp(!!highlight), fontSize: highlight ? 15 : 13, fontWeight: highlight ? 700 : 400 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Salvar */}
      <button onClick={save} disabled={saving} style={{ background: saved ? '#16a34a' : saving ? '#4A6272' : '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}>
        {saved ? <><Check size={16} /> Salvo!</> : saving ? 'Salvando...' : (totalFiles > 1 && !isLast) ? <>Salvar e continuar <ChevronRight size={15} /></> : 'Salvar story'}
      </button>

      {lightbox && preview && <ImageLightbox src={preview} title={form.nome || 'Story'} onClose={() => setLightbox(false)} />}
    </div>
  )
})

// ─── Modal de edição (single) ────────────────────────────────────────────────
function EditStoryModal({ story, onClose, onSave, onDelete, inQueue, isLast }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { apiKey, isEditMode } = useStore()
  const [preview, setPreview]   = useState(story?.imageUrl || story?.imageData || null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [form, setFormState]    = useState({ ...EMPTY, ...story })

  function set(k, v) { setFormState(f => ({ ...f, [k]: v })) }
  function handleFile(file) { if (!file) return; const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(file) }

  async function extract() {
    if (!preview || !apiKey) { setError('Configure a chave da API Anthropic.'); return }
    setLoading(true); setError(null)
    try {
      const [hdr, b64] = preview.split(',')
      const mt = hdr.match(/:(.*?);/)?.[1] || 'image/jpeg'
      const data = await extractStoryFromImage(b64, mt, apiKey)
      setFormState(f => ({ ...f, ...Object.fromEntries(Object.entries(data).filter(([,v]) => v != null)) }))
    } catch (e) { setError('Não foi possível extrair: ' + e.message) }
    finally { setLoading(false) }
  }

  async function save() {
    if (saving) return; setSaving(true)
    try {
      const compressed = preview?.startsWith('data:') ? await compressImage(preview) : form.imageData
      onSave({ ...form, imageData: compressed, imagePreview: preview?.startsWith('data:') ? preview : null, ...Object.fromEntries(NUM_FIELDS.map(({ key }) => [key, Number(form[key]) || null])) })
      setSaved(true); setSaving(false)
      setTimeout(() => { setSaved(false); onClose() }, 900)
    } catch (_) { setSaving(false) }
  }

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('_story_edit_inp').click()}
        style={{ border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`, borderRadius: 12, padding: preview ? '10px 14px' : '20px 14px', cursor: 'pointer', background: '#FAFCFE', display: 'flex', alignItems: 'center', gap: 12 }}>
        <input id="_story_edit_inp" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <>
            <img src={preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'zoom-in', border: '1.5px solid #E8ECF0' }} onClick={e => { e.stopPropagation(); setLightbox(true) }} />
            <div style={{ flex: 1 }} onClick={e => e.stopPropagation()}><p style={{ color: '#1C252E', fontWeight: 700, fontSize: 13 }}>Print do story</p><span style={{ color: '#1C252E', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setLightbox(true) }}>ver imagem ↗</span></div>
            <button type="button" onClick={e => { e.stopPropagation(); setPreview(null) }} style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #fecaca', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#ef4444" /></button>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}><Upload size={22} color="#C3EBF7" style={{ margin: '0 auto 6px' }} /><p style={{ color: '#8A9BB0', fontSize: 13 }}>Substituir print</p></div>
        )}
      </div>
      {preview && <button onClick={extract} disabled={loading} style={{ background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: loading ? 0.75 : 1 }}><Sparkles size={14} />{loading ? 'Extraindo...' : 'Extrair métricas'}</button>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px' }}><p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p></div>}
      <div><label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nome</label><input value={form.nome || ''} onChange={e => set('nome', e.target.value)} style={inp(false)} /></div>
      {/* Tema */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tema</label>
        {form.tema?.length > 0 && <p style={{ color: '#1C252E', fontSize: 11, marginBottom: 6 }}>{form.tema.length} selecionado{form.tema.length > 1 ? 's' : ''}: {form.tema.join(' · ')}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMAS.map(t => {
            const sel = Array.isArray(form.tema) && form.tema.includes(t)
            return (
              <button key={t} type="button"
                onClick={() => set('tema', sel ? form.tema.filter(x => x !== t) : [...(form.tema || []), t])}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: sel ? 700 : 400, background: sel ? '#1C252E' : '#F0F4F8', color: sel ? '#C3EBF7' : '#4A6272', border: sel ? '1.5px solid #1C252E' : '1.5px solid #E0E7EF', transition: 'all 0.12s' }}>
                {sel && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}{t}
              </button>
            )
          })}
        </div>
      </div>
      <div><label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</label><input value={form.data || ''} onChange={e => set('data', e.target.value)} placeholder="DD/MM/AAAA" style={inp(false)} /></div>
      <div><p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Métricas</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {NUM_FIELDS.map(({ key, label, highlight }) => (
            <div key={key} style={highlight ? { gridColumn: '1 / -1' } : {}}><label style={{ color: highlight ? '#1a7a96' : '#8A9BB0', fontSize: 11, fontWeight: highlight ? 700 : 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label><input type="number" value={form[key] === null || form[key] === undefined ? '' : form[key]} onChange={e => set(key, e.target.value)} placeholder="—" style={{ ...inp(!!highlight), fontSize: highlight ? 15 : 13 }} /></div>
          ))}
        </div>
      </div>
      {isEditMode ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: saved ? '#16a34a' : '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saved ? <><Check size={16} /> Salvo!</>
              : saving ? 'Salvando...'
              : inQueue && !isLast ? <>Salvar e continuar <ChevronRight size={15} /></>
              : 'Atualizar story'}
          </button>
          {onDelete && <button onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return } onDelete() }} style={{ background: confirmDelete ? '#ef4444' : '#FEF2F2', color: confirmDelete ? '#fff' : '#ef4444', border: `1px solid ${confirmDelete ? '#ef4444' : '#fecaca'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, flexShrink: 0 }}><Trash2 size={15} />{confirmDelete ? 'Confirmar?' : 'Excluir'}</button>}
        </div>
      ) : (
        <div style={{ background: 'rgba(195,235,247,0.15)', border: '1px solid rgba(195,235,247,0.5)', borderRadius: 9, padding: '8px 14px' }}>
          <p style={{ color: '#1a7a96', fontSize: 12, fontWeight: 600 }}>Modo visualização — desbloqueie para editar</p>
        </div>
      )}
      {lightbox && preview && <ImageLightbox src={preview} title={form.nome || 'Story'} onClose={() => setLightbox(false)} />}
    </div>
  )
}

// ─── Modal principal ─────────────────────────────────────────────────────────
export default function StoryUploadModal({ mode = 'new', story = null, onClose, onSave, onDelete, queueIdx, queueTotal }) {
  const { isEditMode } = useStore()

  // Modo edição
  if (mode === 'update') {
    const inQueue    = queueTotal != null && queueTotal > 1
    const isLast     = inQueue && queueIdx === queueTotal - 1
    const queueLabel = inQueue ? `Story ${queueIdx + 1} de ${queueTotal}` : null

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} className="modal-overlay-bottom" onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }} className="scrollbar-thin modal-inner" onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
            <div>
              <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>{isEditMode ? 'Editar story' : 'Ver story'}</h2>
              {queueLabel && <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 1 }}>{queueLabel}</p>}
            </div>
            <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#8A9BB0" /></button>
          </div>
          <EditStoryModal
            story={story}
            inQueue={inQueue}
            isLast={isLast}
            onClose={onClose}
            onSave={dados => {
              onSave(dados)
              if (!inQueue || isLast) onClose()
              // se não é último, o pai (fila) já avança — modal some via key
            }}
            onDelete={onDelete ? () => { onDelete(); onClose() } : undefined}
          />
        </div>
      </div>
    )
  }

  // Modo novo: múltiplos arquivos
  return <MultiStoryModal onClose={onClose} onSave={onSave} />
}

// ─── Multi upload ─────────────────────────────────────────────────────────────
function MultiStoryModal({ onClose, onSave }) {
  const [files, setFiles]           = useState([])
  const [current, setCurrent]       = useState(0)
  const [dragging, setDragging]     = useState(false)
  const [formStates, setFormStates] = useState([])
  const singleRef = useRef(null)

  function loadFiles(fileList) {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    Promise.all(arr.map(f => new Promise(resolve => {
      const r = new FileReader(); r.onload = e => resolve({ name: f.name, dataUrl: e.target.result }); r.readAsDataURL(f)
    }))).then(loaded => { setFiles(loaded); setCurrent(0); setFormStates([]) })
  }

  function navigateTo(idx) {
    if (singleRef.current) {
      const snap = singleRef.current.getSnapshot()
      setFormStates(prev => { const next = [...prev]; next[current] = snap; return next })
    }
    setCurrent(idx)
  }

  if (files.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} className="modal-overlay-bottom" onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Novo story</h2>
            <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#8A9BB0" /></button>
          </div>
          <div style={{ padding: 20 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); loadFiles(e.dataTransfer.files) }}
              onClick={() => document.getElementById('_multi_story_inp').click()}
              style={{ border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`, borderRadius: 14, padding: '40px 20px', cursor: 'pointer', background: dragging ? '#F0F8FF' : '#FAFCFE', textAlign: 'center' }}>
              <input id="_multi_story_inp" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => loadFiles(e.target.files)} />
              <Upload size={28} color="#C3EBF7" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Arraste os prints ou clique para selecionar</p>
              <p style={{ color: '#8A9BB0', fontSize: 12 }}>Selecione um ou vários de uma vez</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isLast      = current === files.length - 1
  const savedState  = formStates[current]
  const initialPost = savedState?.form ?? {}
  const initialPreview = savedState?.preview ?? files[current]?.dataUrl ?? null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} className="modal-overlay-bottom" onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }} className="scrollbar-thin modal-inner" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
          <div>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Novo story</h2>
            {files.length > 1 && <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 1 }}>{current + 1} de {files.length} arquivos</p>}
          </div>
          <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#8A9BB0" /></button>
        </div>

        {/* Miniaturas */}
        {files.length > 1 && (
          <div style={{ padding: '10px 20px 0', display: 'flex', gap: 6, overflowX: 'auto' }} className="scrollbar-thin">
            {files.map((f, i) => (
              <div key={i} onClick={() => navigateTo(i)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === current ? '#FF6200' : '#E8ECF0'}` }}>
                <img src={f.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <SingleStoryForm
          key={current}
          ref={singleRef}
          initialPost={initialPost}
          initialPreview={initialPreview}
          onClose={onClose}
          onSave={dados => {
            onSave(dados)
            if (isLast) onClose()
            else navigateTo(current + 1)
          }}
          isLast={isLast}
          currentIdx={current}
          totalFiles={files.length}
        />
      </div>
    </div>
  )
}
