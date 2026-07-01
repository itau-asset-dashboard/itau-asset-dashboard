import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { X, Upload, Sparkles, Check } from 'lucide-react'
import { TEMAS } from './UploadModal'
import { extractLinkedinFromImage } from '../utils/anthropic'
import { useStore } from '../store/useStore'
import { uploadLinkedinImage } from '../lib/supabase'
import ImageLightbox from './ImageLightbox'

const TIPOS = ['Imagem', 'Vídeo', 'Artigo', 'Documento']

const EMPTY = {
  nome: '', tema: [], data_post: '', tipo: 'Imagem',
  impressoes: '', visualizacoes: '', cliques: '', ctr: '', reacoes: '',
  status: 'parcial',
}

const NUM_FIELDS = [
  { key: 'impressoes',    label: 'Impressões' },
  { key: 'visualizacoes', label: 'Visualizações' },
  { key: 'cliques',       label: 'Cliques' },
  { key: 'ctr',           label: 'CTR (%)', decimal: true },
  { key: 'reacoes',       label: 'Reações' },
]

// ─── Modal principal (entry point) ───────────────────────────────────────────
export default function LinkedinUploadModal({ mode = 'new', initial = null, onClose, onSave }) {
  if (mode === 'edit') {
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', overflow:'auto', boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Editar post LinkedIn</h2>
            <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
              <X size={16} color="#8A9BB0"/>
            </button>
          </div>
          <SingleLinkedinModal mode="edit" initial={initial} onClose={onClose} onSave={onSave} isLast={true} totalFiles={1}/>
        </div>
      </div>
    )
  }
  return <MultiLinkedinModal onClose={onClose} onSave={onSave} />
}

// ─── Wrapper multi-arquivo ────────────────────────────────────────────────────
function MultiLinkedinModal({ onClose, onSave }) {
  const [files, setFiles]       = useState([])
  const [current, setCurrent]   = useState(0)
  const [dragging, setDragging] = useState(false)
  const [formStates, setFormStates] = useState([])
  const singleRef = useRef(null)

  function loadFiles(fileList) {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    Promise.all(arr.map(f => new Promise(resolve => {
      const r = new FileReader()
      r.onload = e => resolve({ name: f.name, dataUrl: e.target.result })
      r.readAsDataURL(f)
    }))).then(loaded => { setFiles(loaded); setCurrent(0); setFormStates([]) })
  }

  function navigateTo(idx) {
    if (singleRef.current) {
      const snap = singleRef.current.getSnapshot()
      setFormStates(prev => { const n = [...prev]; n[current] = snap; return n })
    }
    setCurrent(idx)
  }

  if (files.length === 0) {
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Novo post LinkedIn</h2>
            <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
              <X size={16} color="#8A9BB0"/>
            </button>
          </div>
          <div style={{ padding:20 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); loadFiles(e.dataTransfer.files) }}
              onClick={() => document.getElementById('_li_multi_inp').click()}
              style={{ border:`2px dashed ${dragging ? '#0A66C2' : '#D8EEF6'}`, borderRadius:14, padding:'40px 20px', cursor:'pointer', background: dragging ? '#F0F7FF' : '#FAFCFE', textAlign:'center' }}>
              <input id="_li_multi_inp" type="file" accept="image/*" multiple style={{ display:'none' }}
                onChange={e => loadFiles(e.target.files)}/>
              <Upload size={28} color="#0A66C2" style={{ margin:'0 auto 10px' }}/>
              <p style={{ color:'#1C252E', fontSize:14, fontWeight:600, marginBottom:4 }}>Arraste os prints ou clique para selecionar</p>
              <p style={{ color:'#8A9BB0', fontSize:12 }}>Selecione um ou vários arquivos de uma vez</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isLast = current === files.length - 1
  const savedState = formStates[current]
  const defaultName = files[current]?.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim() || ''
  const initialPost    = savedState?.form    ?? { nome: defaultName }
  const initialPreview = savedState?.preview ?? files[current]?.dataUrl ?? null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', overflow:'auto', boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
          <div>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Novo post LinkedIn</h2>
            {files.length > 1 && <p style={{ color:'#8A9BB0', fontSize:12, marginTop:1 }}>{current + 1} de {files.length} arquivos</p>}
          </div>
          <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
            <X size={16} color="#8A9BB0"/>
          </button>
        </div>

        {/* Miniaturas da fila */}
        {files.length > 1 && (
          <div style={{ padding:'10px 20px 0', display:'flex', gap:6, overflowX:'auto' }}>
            {files.map((f, i) => (
              <div key={i} onClick={() => navigateTo(i)}
                style={{ flexShrink:0, width:44, height:44, borderRadius:8, overflow:'hidden', cursor:'pointer',
                  border:`2px solid ${i === current ? '#0A66C2' : '#E8ECF0'}` }}>
                <img src={f.dataUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
            ))}
          </div>
        )}

        <SingleLinkedinModal
          key={current}
          ref={singleRef}
          mode="new"
          initial={initialPost}
          initialPreview={initialPreview}
          isLast={isLast}
          totalFiles={files.length}
          onClose={onClose}
          onSave={async post => {
            await onSave(post)
            if (isLast) onClose()
            else navigateTo(current + 1)
          }}
        />
      </div>
    </div>
  )
}

// ─── Formulário individual ────────────────────────────────────────────────────
const SingleLinkedinModal = forwardRef(function SingleLinkedinModal(
  { mode = 'new', initial = null, initialPreview = null, onClose, onSave, isLast = true, totalFiles = 1 },
  ref
) {
  const { apiKey } = useStore()
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY, ...(initial || {}) }
    if (typeof base.tema === 'string') { try { base.tema = JSON.parse(base.tema) } catch (_) { base.tema = base.tema ? [base.tema] : [] } }
    if (!Array.isArray(base.tema)) base.tema = []
    return base
  })
  const [preview, setPreview]     = useState(initialPreview || initial?.image_url || initial?.imageUrl || null)
  const [imageData, setImageData] = useState(() => {
    if (initialPreview?.startsWith('data:')) return initialPreview.split(',')[1]
    return null
  })
  const [mediaType, setMediaType] = useState(() => {
    if (initialPreview?.startsWith('data:')) {
      const m = initialPreview.match(/^data:([^;]+);/)
      return m?.[1] || 'image/jpeg'
    }
    return 'image/jpeg'
  })
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [lightbox, setLightbox]   = useState(null)

  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({ form, preview }),
  }))

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      setImageData(dataUrl.split(',')[1])
      setMediaType(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  async function extract() {
    if (!imageData) return
    if (!apiKey) { alert('Configure a chave de API Anthropic primeiro.'); return }
    setLoading(true)
    try {
      const dados = await extractLinkedinFromImage(imageData, mediaType, apiKey)
      setForm(f => ({
        ...f,
        data_post:     dados.data_post     || f.data_post,
        impressoes:    dados.impressoes    ?? f.impressoes,
        visualizacoes: dados.visualizacoes ?? f.visualizacoes,
        cliques:       dados.cliques       ?? f.cliques,
        ctr:           dados.ctr           ?? f.ctr,
        reacoes:       dados.reacoes       ?? f.reacoes,
      }))
    } catch (e) {
      alert('Erro ao extrair: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!form.data_post) { alert('Informe a data do post.'); return }
    setSaving(true)
    try {
      const id = initial?.id || `${Date.now()}-${Math.random().toString(36).slice(2,7)}`
      let imageUrl = initial?.image_url || initial?.imageUrl || null
      if (imageData) {
        const dataUrl = `data:${mediaType};base64,${imageData}`
        imageUrl = await uploadLinkedinImage(id, dataUrl).catch(() => null)
      }
      const post = {
        ...form,
        id,
        image_url: imageUrl,
        tema:          Array.isArray(form.tema) ? JSON.stringify(form.tema) : form.tema,
        impressoes:    form.impressoes    !== '' ? Number(form.impressoes)    : null,
        visualizacoes: form.visualizacoes !== '' ? Number(form.visualizacoes) : null,
        cliques:       form.cliques       !== '' ? Number(form.cliques)       : null,
        ctr:           form.ctr           !== '' ? Number(form.ctr)           : null,
        reacoes:       form.reacoes       !== '' ? Number(form.reacoes)       : null,
      }
      await onSave(post)
      setSaved(true)
      if (isLast && totalFiles === 1) setTimeout(onClose, 700)
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const btnLabel = saved ? 'Salvo!' : saving ? 'Salvando...'
    : mode === 'edit' ? 'Salvar alterações'
    : isLast ? (totalFiles > 1 ? 'Salvar e fechar' : 'Adicionar post')
    : 'Salvar e próximo →'

  return (
    <div style={{ padding:'16px 20px 28px' }}>
      {/* Imagem */}
      <div style={{ marginBottom:14 }}>
        {!preview ? (
          <label style={{ display:'block', border:'2px dashed #E0E7EF', borderRadius:12, padding:'24px 16px', textAlign:'center', cursor:'pointer', background:'#FAFCFE' }}>
            <Upload size={22} color="#0A66C2" style={{ margin:'0 auto 6px' }}/>
            <p style={{ color:'#9AAAB8', fontSize:13 }}>Clique para enviar o print do LinkedIn</p>
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          </label>
        ) : (
          <div style={{ position:'relative' }}>
            <img src={preview} alt="preview" style={{ width:'100%', borderRadius:10, maxHeight:180, objectFit:'cover', cursor:'pointer' }} onClick={() => setLightbox(preview)}/>
            <label style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', borderRadius:8, padding:'5px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Upload size={12} color="#fff"/>
              <span style={{ color:'#fff', fontSize:11 }}>Trocar</span>
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
            </label>
          </div>
        )}
        {preview && (
          <button onClick={extract} disabled={loading} style={{ marginTop:8, background:'#1C252E', color:'#C3EBF7', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:700, cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', opacity:loading?0.75:1 }}>
            <Sparkles size={14}/>{loading ? 'Extraindo...' : 'Extrair métricas com IA'}
          </button>
        )}
      </div>

      {/* Nome */}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>Nome / título</p>
        <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Resultado Q1 2026"
          style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif' }}/>
      </div>

      {/* Data */}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>Data da publicação</p>
        <input value={form.data_post} onChange={e => set('data_post', e.target.value)} placeholder="DD/MM/AAAA"
          style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif' }}/>
      </div>

      {/* Tipo */}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:6 }}>Tipo de conteúdo</p>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => set('tipo', t)}
              style={{ padding:'5px 14px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                fontWeight: form.tipo===t ? 700 : 400, background: form.tipo===t ? '#0A66C2' : '#F0F4F8',
                color: form.tipo===t ? '#fff' : '#4A6272', border: form.tipo===t ? '1.5px solid #0A66C2' : '1.5px solid #E0E7EF', transition:'all 0.12s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Temas */}
      <div style={{ marginBottom:10 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:6 }}>Temas</p>
        {form.tema?.length > 0 && <p style={{ color:'#FF6200', fontSize:11, marginBottom:6 }}>{form.tema.join(' · ')}</p>}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {TEMAS.map(t => {
            const sel = Array.isArray(form.tema) && form.tema.includes(t)
            return (
              <button key={t} onClick={() => set('tema', sel ? form.tema.filter(x => x !== t) : [...(form.tema||[]), t])}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                  fontWeight: sel ? 700 : 400, background: sel ? '#1C252E' : '#F0F4F8',
                  color: sel ? '#C3EBF7' : '#4A6272', border: sel ? '1.5px solid #1C252E' : '1.5px solid #E0E7EF', transition:'all 0.12s' }}>
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Métricas */}
      <div style={{ marginBottom:12 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:8 }}>Métricas</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {NUM_FIELDS.map(({ key, label, decimal }) => (
            <div key={key}>
              <p style={{ color:'#9AAAB8', fontSize:11, marginBottom:3 }}>{label}</p>
              <input type="number" step={decimal ? '0.01' : '1'} value={form[key]} onChange={e => set(key, e.target.value)} placeholder="—"
                style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif' }}/>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom:18 }}>
        <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:6 }}>Status dos dados</p>
        <div style={{ display:'flex', gap:8 }}>
          {['parcial','final'].map(s => (
            <button key={s} onClick={() => set('status', s)}
              style={{ flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${form.status===s ? '#1C252E' : '#E8ECF0'}`,
                background: form.status===s ? '#1C252E' : '#fff', cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                color: form.status===s ? '#C3EBF7' : '#8A9BB0', fontSize:13, fontWeight: form.status===s ? 700 : 400 }}>
              {s === 'parcial' ? 'Parcial' : 'Final'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ width:'100%', background: saved ? '#16a34a' : '#1C252E', color:'#C3EBF7', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:saving?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.2s' }}>
        {saved ? <><Check size={16}/> {btnLabel}</> : btnLabel}
      </button>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} title={form.nome || 'LinkedIn'}/>}
    </div>
  )
})
