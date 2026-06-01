import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { X, Upload, Check, Sparkles, Trash2, ChevronRight } from 'lucide-react'
import { extractPostFromImage } from '../utils/anthropic'
import { useStore } from '../store/useStore'

const TIPOS = ['Reels', 'Carrossel', 'Foto estática']

export const TEMAS = [
  'Carreira',
  'ETFs',
  'Análises econômicas',
  'Trends',
  'Fundos',
  'Performance em destaque',
  'ETFs em destaque',
  'Educacionais ETFs',
  'Ring the bell',
  'Dump',
  'Live',
  'Dividendos',
  'Premiações',
  'Mind Asset',
  'Eventos',
]

const NUM_FIELDS = [
  { key: 'contas_alcancadas', label: 'Contas alcançadas', highlight: true },
  { key: 'visualizacoes',     label: 'Visualizações' },
  { key: 'interacoes',        label: 'Interações (total)' },
  { key: 'curtidas',          label: 'Curtidas' },
  { key: 'comentarios',       label: 'Comentários' },
  { key: 'salvamentos',       label: 'Salvamentos' },
  { key: 'compartilhamentos', label: 'Compartilhamentos' },
]

const inp = (highlight) => ({
  width: '100%',
  border: `1.5px solid ${highlight ? 'rgba(195,235,247,0.9)' : '#E8ECF0'}`,
  borderRadius: 9, padding: '8px 12px', fontSize: 13,
  outline: 'none', color: '#1C252E', fontFamily: 'DM Sans, sans-serif',
  background: highlight ? 'rgba(195,235,247,0.06)' : '#fff',
})

// Garante exibição no formato DD/MM/AAAA
function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.replace(/-/g, '/').split('/')
  if (parts.length !== 3) return dateStr
  // Se ano veio primeiro (YYYY/MM/DD), inverte
  if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2]}`
}

// Abre imagem em nova aba — converte base64 para Blob se necessário (Chrome bloqueia data URLs diretas)
function openImage(src) {
  if (!src) return
  if (src.startsWith('http')) { window.open(src, '_blank'); return }
  try {
    const [header, base64] = src.split(',')
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.onload = () => URL.revokeObjectURL(url)
  } catch (_) { window.open(src, '_blank') }
}

function fileToName(filename) {
  if (!filename) return ''
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

async function compressImage(dataUrl, maxPx = 800, quality = 0.72) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(dataUrl), 8000) // timeout 8s
    const img = new Image()
    img.onload = () => {
      clearTimeout(timer)
      try {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (_) {
        resolve(dataUrl)
      }
    }
    img.onerror = () => { clearTimeout(timer); resolve(dataUrl) }
    img.src = dataUrl
  })
}

const EMPTY = {
  nome: '', tema: '', data_post: '', tipo: 'Reels', descricao: '',
  contas_alcancadas: '', visualizacoes: '', interacoes: '',
  curtidas: '', comentarios: '', salvamentos: '', compartilhamentos: '',
  status: 'parcial', imageData: null,
}

// ─── Modal para um único post ────────────────────────────────────────────────
const SinglePostModal = forwardRef(function SinglePostModal({ initialPost, initialPreview, onClose, onSave, onDelete, isLast, currentIdx, totalFiles }, ref) {
  const { apiKey } = useStore()
  const [preview,  setPreview]  = useState(initialPreview || initialPost?.imageData || null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [saved,    setSaved]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState(initialPost ? { ...EMPTY, ...initialPost } : { ...EMPTY })

  const isUpdate = !!initialPost?.id

  // Expose snapshot so MultiUploadModal can save state before navigating
  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({ form, preview }),
  }))

  function handleFile(file) {
    if (!file) return
    if (!form.nome) setForm(f => ({ ...f, nome: fileToName(file.name) }))
    const r = new FileReader()
    r.onload = e => { setPreview(e.target.result); setError(null) }
    r.readAsDataURL(file)
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function extract() {
    if (!preview) return
    if (!apiKey) { setError('Configure a chave da API Anthropic.'); return }
    setLoading(true); setError(null)
    try {
      const [hdr, b64] = preview.split(',')
      const mt = hdr.match(/:(.*?);/)?.[1] || 'image/jpeg'
      const data = await extractPostFromImage(b64, mt, apiKey)
      setForm(f => ({
        ...f,
        data_post:         data.data_post         ?? f.data_post,
        tipo:              data.tipo              ?? f.tipo,
        contas_alcancadas: data.contas_alcancadas ?? f.contas_alcancadas,
        visualizacoes:     data.visualizacoes     ?? f.visualizacoes,
        interacoes:        data.interacoes        ?? f.interacoes,
        curtidas:          data.curtidas          ?? f.curtidas,
        comentarios:       data.comentarios       ?? f.comentarios,
        salvamentos:       data.salvamentos       ?? f.salvamentos,
        compartilhamentos: data.compartilhamentos ?? f.compartilhamentos,
      }))
    } catch (e) {
      setError('Não foi possível extrair os dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      // Versão comprimida para localStorage (thumbnail)
      const compressed = preview ? await compressImage(preview) : form.imageData
      const dados = {
        ...form,
        imageData: compressed,
        // Passa o preview original para upload em alta qualidade no Storage
        imagePreview: preview || null,
        ...Object.fromEntries(NUM_FIELDS.map(({ key }) => [key, Number(form[key]) || null])),
      }
      onSave(dados)
      setSaved(true)
      setSaving(false)
      setTimeout(() => setSaved(false), 1200)
    } catch (e) {
      setSaving(false)
      setError('Erro ao salvar. Tente novamente.')
    }
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete()
  }

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>


      {/* Contador se múltiplos */}
      {totalFiles > 1 && (
        <div style={{ background: '#F5F8FA', borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8A9BB0', fontSize: 12 }}>Post {currentIdx + 1} de {totalFiles}</span>
          <span style={{ color: isLast ? '#22c55e' : '#FF6200', fontSize: 11, fontWeight: 600 }}>
            {isLast ? '✓ Último post' : `Faltam ${totalFiles - currentIdx - 1}`}
          </span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('_file_inp_single').click()}
        style={{
          border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`,
          borderRadius: 12, padding: preview ? '10px 14px' : '20px 14px',
          cursor: 'pointer', background: dragging ? '#F0F8FF' : '#FAFCFE',
          transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <input id="_file_inp_single" type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <>
            <img src={form.imageUrl || preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'zoom-in' }}
              onClick={e => { e.stopPropagation(); openImage(form.imageUrl || preview) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#1C252E', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Última evidência</p>
              <p style={{ color: '#8A9BB0', fontSize: 11 }}>
                {form.data_post ? `📅 ${formatDate(form.data_post)}` : 'Sem data definida'}
                {' · '}
                <span style={{ color: '#0891B2', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); openImage(form.imageUrl || preview) }}>
                  abrir ↗
                </span>
              </p>
            </div>
            {/* Botão remover imagem */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setPreview(null); set('imageData', null); set('imageUrl', null) }}
              title="Remover evidência"
              style={{
                flexShrink: 0, background: '#FEF2F2', border: '1px solid #fecaca',
                borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Trash2 size={13} color="#ef4444" />
            </button>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <Upload size={22} color="#C3EBF7" style={{ margin: '0 auto 6px' }} />
            <p style={{ color: '#8A9BB0', fontSize: 13 }}>Arraste o print ou clique para selecionar</p>
            <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 3 }}>O nome do arquivo será usado como título</p>
          </div>
        )}
      </div>

      {/* Botão extrair */}
      {preview && (
        <button onClick={extract} disabled={loading} style={{
          background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 10,
          padding: '10px', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          opacity: loading ? 0.75 : 1, width: '100%',
        }}>
          <Sparkles size={14} />
          {loading ? 'Extraindo dados...' : 'Extrair métricas automaticamente'}
        </button>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px' }}>
          <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>
        </div>
      )}

      {/* Nome */}
      <div>
        <label style={{ color: '#1C252E', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>
          Nome do post <span style={{ color: '#8A9BB0', fontWeight: 400 }}>(título para identificação)</span>
        </label>
        <input value={form.nome || ''} onChange={e => set('nome', e.target.value)}
          placeholder="Ex: Caique Cardoso — ETFs Itaú Asset"
          style={{ ...inp(false), fontSize: 14, padding: '10px 12px', border: '1.5px solid #1C252E30' }}
          autoFocus={!isUpdate} />
      </div>

      {/* Tema — pills */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tema
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMAS.map(t => (
            <button key={t} type="button" onClick={() => set('tema', form.tema === t ? '' : t)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontWeight: form.tema === t ? 700 : 400,
                background: form.tema === t ? '#1C252E' : '#F0F4F8',
                color: form.tema === t ? '#C3EBF7' : '#4A6272',
                border: form.tema === t ? '1.5px solid #1C252E' : '1.5px solid #E0E7EF',
                transition: 'all 0.12s',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Descrição / Observações
        </label>
        <textarea value={form.descricao || ''} onChange={e => set('descricao', e.target.value)}
          rows={2} placeholder="Contexto do post, campanha, etc."
          style={{ ...inp(false), resize: 'vertical' }} />
      </div>

      {/* Data + Tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</label>
          <input value={form.data_post || ''} onChange={e => set('data_post', e.target.value)}
            placeholder="DD/MM/AAAA" style={inp(false)} />
        </div>
        <div>
          <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo</label>
          <select value={form.tipo || 'Reels'} onChange={e => set('tipo', e.target.value)}
            style={{ ...inp(false), background: '#fff' }}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Métricas */}
      <div>
        <p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
          Métricas
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {NUM_FIELDS.map(({ key, label, highlight }) => (
            <div key={key} style={highlight ? { gridColumn: '1 / -1' } : {}}>
              <label style={{
                color: highlight ? '#1a7a96' : '#8A9BB0',
                fontSize: 11, fontWeight: highlight ? 700 : 600,
                display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>{label}</label>
              <input type="number"
                value={form[key] === null || form[key] === undefined ? '' : form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder="—"
                style={{ ...inp(!!highlight), fontSize: highlight ? 15 : 13, fontWeight: highlight ? 700 : 400 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status:</span>
        {['parcial', 'final'].map(s => (
          <button key={s} onClick={() => set('status', s)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: form.status === s ? (s === 'final' ? '#1C252E' : 'rgba(195,235,247,0.35)') : '#F4F6F8',
            color: form.status === s ? (s === 'final' ? '#C3EBF7' : '#1a7a96') : '#8A9BB0',
            border: form.status === s && s === 'parcial' ? '1px solid rgba(195,235,247,0.7)' : '1px solid transparent',
          }}>
            {s === 'parcial' ? '🕐 Dado parcial' : '✓ Dado final'}
          </button>
        ))}
      </div>

      {/* Salvar + Excluir */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} style={{
          flex: 1, background: saved ? '#22c55e' : saving ? '#4A6272' : '#1C252E',
          color: '#C3EBF7', border: 'none', borderRadius: 12,
          padding: '12px', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s', opacity: saving ? 0.8 : 1,
        }}>
          {saved ? <><Check size={16} /> Salvo!</> : saving ? 'Salvando...' : isUpdate ? 'Atualizar post' : (totalFiles > 1 && !isLast) ? <>Salvar e continuar <ChevronRight size={15}/></> : 'Salvar post'}
        </button>

        {isUpdate && onDelete && (
          <button onClick={handleDelete} style={{
            background: confirmDelete ? '#ef4444' : '#FEF2F2',
            color: confirmDelete ? '#fff' : '#ef4444',
            border: `1px solid ${confirmDelete ? '#ef4444' : '#fecaca'}`,
            borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s', flexShrink: 0,
          }}>
            <Trash2 size={15} />
            {confirmDelete ? 'Confirmar?' : 'Excluir'}
          </button>
        )}
      </div>
    </div>
  )
})

// ─── Modal principal (suporta 1 ou vários arquivos) ──────────────────────────
export default function UploadModal({ mode = 'new', post = null, onClose, onSave, onDelete }) {
  const { deletePost } = useStore()

  // Modo atualização: sempre single
  if (mode === 'update') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }} className="scrollbar-thin">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Editar post</h2>
            <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#8A9BB0" />
            </button>
          </div>
          <SinglePostModal
            initialPost={post}
            initialPreview={post?.imageUrl || post?.imageData || null}
            onClose={onClose}
            onSave={dados => { onSave(dados); onClose() }}
            onDelete={onDelete ? () => { onDelete(); onClose() } : undefined}
          />
        </div>
      </div>
    )
  }

  // Modo novo: suporta múltiplos arquivos
  return <MultiUploadModal onClose={onClose} onSave={onSave} />
}

// ─── Modal de múltiplos uploads ──────────────────────────────────────────────
function MultiUploadModal({ onClose, onSave }) {
  const [files, setFiles]         = useState([])  // Array de { name, dataUrl }
  const [current, setCurrent]     = useState(0)
  const [dragging, setDragging]   = useState(false)
  const [formStates, setFormStates] = useState([]) // saved { form, preview } per index
  const singleRef = useRef(null)

  function loadFiles(fileList) {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    const readers = arr.map(f => new Promise(resolve => {
      const r = new FileReader()
      r.onload = e => resolve({ name: f.name, dataUrl: e.target.result })
      r.readAsDataURL(f)
    }))
    Promise.all(readers).then(loaded => {
      setFiles(loaded)
      setCurrent(0)
      setFormStates([])
    })
  }

  // Save current form state then navigate to idx
  function navigateTo(idx) {
    if (singleRef.current) {
      const snapshot = singleRef.current.getSnapshot()
      setFormStates(prev => {
        const next = [...prev]
        next[current] = snapshot
        return next
      })
    }
    setCurrent(idx)
  }

  if (files.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Novo post</h2>
            <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#8A9BB0" />
            </button>
          </div>
          <div style={{ padding: 20 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); loadFiles(e.dataTransfer.files) }}
              onClick={() => document.getElementById('_multi_inp').click()}
              style={{
                border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`,
                borderRadius: 14, padding: '40px 20px', cursor: 'pointer',
                background: dragging ? '#F0F8FF' : '#FAFCFE', textAlign: 'center',
              }}>
              <input id="_multi_inp" type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => loadFiles(e.target.files)} />
              <Upload size={28} color="#C3EBF7" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Arraste os prints ou clique para selecionar
              </p>
              <p style={{ color: '#8A9BB0', fontSize: 12 }}>
                Selecione um ou vários arquivos de uma vez
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isLast = current === files.length - 1

  // Restored state for current index (if user navigated back)
  const savedState = formStates[current]
  const defaultName = files[current]
    ? files[current].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    : ''
  const initialPost    = savedState?.form    ?? { nome: defaultName }
  const initialPreview = savedState?.preview ?? files[current]?.dataUrl ?? null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }} className="scrollbar-thin">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
          <div>
            <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Novo post</h2>
            {files.length > 1 && <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 1 }}>{current + 1} de {files.length} arquivos</p>}
          </div>
          <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#8A9BB0" />
          </button>
        </div>

        {/* Miniaturas de fila */}
        {files.length > 1 && (
          <div style={{ padding: '10px 20px 0', display: 'flex', gap: 6, overflowX: 'auto' }} className="scrollbar-thin">
            {files.map((f, i) => (
              <div key={i} onClick={() => navigateTo(i)}
                style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${i === current ? '#FF6200' : '#E8ECF0'}` }}>
                <img src={f.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <SinglePostModal
          key={current}
          ref={singleRef}
          initialPost={initialPost}
          initialPreview={initialPreview}
          onClose={onClose}
          onSave={dados => {
            onSave(dados)          // addPost — não fecha o modal
            if (isLast) onClose()  // fecha só no último
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
