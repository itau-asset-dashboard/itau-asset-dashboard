import { useState } from 'react'
import { X, Check, Trash2 } from 'lucide-react'
import { TEMAS } from './UploadModal'
import { useStore } from '../store/useStore'

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

export default function LinkedinUploadModal({ mode = 'new', initial = null, onClose, onSave, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState(() => {
    const base = { ...EMPTY, ...(initial || {}) }
    if (typeof base.tema === 'string') { try { base.tema = JSON.parse(base.tema) } catch (_) { base.tema = base.tema ? [base.tema] : [] } }
    if (!Array.isArray(base.tema)) base.tema = []
    return base
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(form.id)
  }

  async function save() {
    if (!form.data_post) { alert('Informe a data do post.'); return }
    setSaving(true)
    try {
      const id = initial?.id || `${Date.now()}-${Math.random().toString(36).slice(2,7)}`
      const post = {
        ...form,
        id,
        tema:          Array.isArray(form.tema) ? JSON.stringify(form.tema) : form.tema,
        impressoes:    form.impressoes    !== '' ? Number(form.impressoes)    : null,
        visualizacoes: form.visualizacoes !== '' ? Number(form.visualizacoes) : null,
        cliques:       form.cliques       !== '' ? Number(form.cliques)       : null,
        ctr:           form.ctr           !== '' ? Number(form.ctr)           : null,
        reacoes:       form.reacoes       !== '' ? Number(form.reacoes)       : null,
      }
      await onSave(post)
      setSaved(true)
      setTimeout(onClose, 700)
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'edit' ? 'Editar post LinkedIn' : 'Novo post LinkedIn'
  const btnLabel = saved ? 'Salvo!' : saving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Adicionar post'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', overflow:'auto', boxShadow:'0 16px 56px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0F4F8' }}>
          <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
            <X size={16} color="#8A9BB0"/>
          </button>
        </div>

        <div style={{ padding:'16px 20px 28px' }}>

          {/* Nome */}
          <div style={{ marginBottom:10 }}>
            <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>Nome / título</p>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Resultado Q1 2026"
              style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box' }}/>
          </div>

          {/* Data */}
          <div style={{ marginBottom:10 }}>
            <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:4 }}>Data da publicação</p>
            <input value={form.data_post} onChange={e => set('data_post', e.target.value)} placeholder="DD/MM/AAAA"
              style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box' }}/>
          </div>

          {/* Tipo */}
          <div style={{ marginBottom:10 }}>
            <p style={{ color:'#6B7A8D', fontSize:12, fontWeight:600, marginBottom:6 }}>Tipo de conteúdo</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {TIPOS.map(t => (
                <button key={t} onClick={() => set('tipo', t)}
                  style={{ padding:'4px 12px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
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
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {TEMAS.map(t => {
                const sel = Array.isArray(form.tema) && form.tema.includes(t)
                return (
                  <button key={t} onClick={() => set('tema', sel ? form.tema.filter(x => x !== t) : [...(form.tema||[]), t])}
                    style={{ padding:'3px 10px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
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
                    style={{ width:'100%', border:'1.5px solid #E8ECF0', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', boxSizing:'border-box' }}/>
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

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving}
              style={{ flex:1, background: saved ? '#16a34a' : '#1C252E', color:'#C3EBF7', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:saving?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.2s' }}>
              {saved ? <><Check size={16}/> {btnLabel}</> : btnLabel}
            </button>
            {mode === 'edit' && onDelete && (
              <button onClick={handleDelete} style={{
                background: confirmDelete ? '#ef4444' : '#FEF2F2',
                color: confirmDelete ? '#fff' : '#ef4444',
                border: `1px solid ${confirmDelete ? '#ef4444' : '#fecaca'}`,
                borderRadius:12, padding:'13px 14px', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                fontSize:13, fontWeight:600, transition:'all 0.15s', flexShrink:0,
              }}>
                <Trash2 size={15}/>
                {confirmDelete ? 'Confirmar?' : 'Excluir'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
