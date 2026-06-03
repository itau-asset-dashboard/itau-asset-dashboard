import { useState } from 'react'
import { X, Upload, Sparkles, Check, Trash2 } from 'lucide-react'
import { extractStoryFromImage } from '../utils/anthropic'
import { useStore } from '../store/useStore'
import ImageLightbox from './ImageLightbox'

const NUM_FIELDS = [
  { key: 'visualizacoes',     label: 'Visualizações',           highlight: true },
  { key: 'contas_alcancadas', label: 'Contas alcançadas',        highlight: false },
  { key: 'interacoes',        label: 'Interações',               highlight: false },
  { key: 'atividade_perfil',  label: 'Atividade do perfil',      highlight: false },
  { key: 'respostas',         label: 'Respostas',                highlight: false },
  { key: 'toques_avancar',    label: 'Toques para avançar',      highlight: false },
  { key: 'toques_retroceder', label: 'Toques para retroceder',   highlight: false },
  { key: 'saidas',            label: 'Saídas',                   highlight: false },
]

const EMPTY = {
  nome: '', data: '', grupo: '',
  visualizacoes: '', contas_alcancadas: '', interacoes: '',
  atividade_perfil: '', respostas: '', toques_avancar: '',
  toques_retroceder: '', saidas: '',
  status: 'final', imageData: null,
}

async function compressImage(dataUrl, maxPx = 800, quality = 0.72) {
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

export default function StoryUploadModal({ mode = 'new', story = null, grupos = [], onClose, onSave, onDelete }) {
  const { apiKey } = useStore()
  const [preview, setPreview]   = useState(story?.imageUrl || story?.imageData || null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [novoGrupo, setNovoGrupo] = useState(false)

  const [form, setFormState] = useState(() => {
    if (story) return { ...EMPTY, ...story }
    return { ...EMPTY }
  })

  const isUpdate = !!story?.id

  function set(k, v) { setFormState(f => ({ ...f, [k]: v })) }

  function handleFile(file) {
    if (!file) return
    const r = new FileReader()
    r.onload = e => { setPreview(e.target.result); setError(null) }
    r.readAsDataURL(file)
  }

  async function extract() {
    if (!preview) return
    if (!apiKey) { setError('Configure a chave da API Anthropic.'); return }
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
    } catch (e) {
      setError('Não foi possível extrair: ' + e.message)
    } finally {
      setLoading(false)
    }
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
      setTimeout(() => { setSaved(false); onClose() }, 900)
    } catch (_) {
      setSaving(false)
      setError('Erro ao salvar.')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      className="modal-overlay-bottom"
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)' }}
        className="scrollbar-thin modal-inner"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>{isUpdate ? 'Editar story' : 'Novo story'}</h2>
          <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#8A9BB0" />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('_story_inp').click()}
            style={{
              border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`,
              borderRadius: 12, padding: preview ? '10px 14px' : '20px 14px',
              cursor: 'pointer', background: dragging ? '#F0F8FF' : '#FAFCFE',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <input id="_story_inp" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              <>
                <img
                  src={form.imageUrl || preview}
                  alt=""
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'zoom-in', border: '1.5px solid #E8ECF0' }}
                  onClick={e => { e.stopPropagation(); setLightbox(true) }}
                />
                <div style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                  <p style={{ color: '#1C252E', fontWeight: 700, fontSize: 13 }}>Print do story</p>
                  <span style={{ color: '#0891B2', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setLightbox(true) }}>ver imagem ↗</span>
                </div>
                <button type="button"
                  onClick={e => { e.stopPropagation(); setPreview(null); set('imageData', null); set('imageUrl', null) }}
                  style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #fecaca', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} color="#ef4444" />
                </button>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <Upload size={22} color="#C3EBF7" style={{ margin: '0 auto 6px' }} />
                <p style={{ color: '#8A9BB0', fontSize: 13 }}>Arraste o print do story ou clique para selecionar</p>
              </div>
            )}
          </div>

          {/* Extrair */}
          {preview && (
            <button onClick={extract} disabled={loading} style={{
              background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 10,
              padding: '10px', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: loading ? 0.75 : 1, width: '100%',
            }}>
              <Sparkles size={14} />
              {loading ? 'Extraindo...' : 'Extrair métricas automaticamente'}
            </button>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px' }}>
              <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>
            </div>
          )}

          {/* Nome */}
          <div>
            <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nome / descrição</label>
            <input value={form.nome || ''} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Story de cobertura do ETF Day" style={inp(false)} autoFocus={!isUpdate} />
          </div>

          {/* Data */}
          <div>
            <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</label>
            <input value={form.data || ''} onChange={e => set('data', e.target.value)}
              placeholder="DD/MM/AAAA" style={inp(false)} />
          </div>

          {/* Grupo */}
          <div>
            <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Grupo <span style={{ color: '#B0BEC5', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
            {novoGrupo ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.grupo || ''} onChange={e => set('grupo', e.target.value)}
                  placeholder="Nome do novo grupo" style={{ ...inp(false), flex: 1 }} autoFocus />
                <button onClick={() => setNovoGrupo(false)}
                  style={{ background: '#F4F6F8', border: 'none', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#8A9BB0' }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.grupo || ''} onChange={e => set('grupo', e.target.value)}
                  style={{ ...inp(false), flex: 1, background: '#fff' }}>
                  <option value="">Sem grupo (story solto)</option>
                  {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button onClick={() => { setNovoGrupo(true); set('grupo', '') }}
                  style={{ background: '#F4F6F8', border: 'none', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#1C252E', whiteSpace: 'nowrap' }}>
                  + Novo grupo
                </button>
              </div>
            )}
          </div>

          {/* Métricas */}
          <div>
            <p style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Métricas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {NUM_FIELDS.map(({ key, label, highlight }) => (
                <div key={key} style={highlight ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ color: highlight ? '#1a7a96' : '#8A9BB0', fontSize: 11, fontWeight: highlight ? 700 : 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  <input type="number"
                    value={form[key] === null || form[key] === undefined ? '' : form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder="—"
                    style={{ ...inp(!!highlight), fontSize: highlight ? 15 : 13, fontWeight: highlight ? 700 : 400 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Salvar / Excluir */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={{
              flex: 1, background: saved ? '#22c55e' : saving ? '#4A6272' : '#1C252E',
              color: '#C3EBF7', border: 'none', borderRadius: 12,
              padding: '12px', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}>
              {saved ? <><Check size={16} /> Salvo!</> : saving ? 'Salvando...' : isUpdate ? 'Atualizar story' : 'Salvar story'}
            </button>
            {isUpdate && onDelete && (
              <button onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return } onDelete() }}
                style={{
                  background: confirmDelete ? '#ef4444' : '#FEF2F2',
                  color: confirmDelete ? '#fff' : '#ef4444',
                  border: `1px solid ${confirmDelete ? '#ef4444' : '#fecaca'}`,
                  borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, flexShrink: 0,
                }}>
                <Trash2 size={15} />
                {confirmDelete ? 'Confirmar?' : 'Excluir'}
              </button>
            )}
          </div>
        </div>
      </div>

      {lightbox && (form.imageUrl || preview) && (
        <ImageLightbox src={form.imageUrl || preview} title={form.nome || 'Story'} onClose={() => setLightbox(false)} />
      )}
    </div>
  )
}
