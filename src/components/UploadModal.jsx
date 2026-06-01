import { useState } from 'react'
import { X, Upload, Check, Sparkles } from 'lucide-react'
import { extractPostFromImage } from '../utils/anthropic'
import { useStore } from '../store/useStore'

const TIPOS = ['Reels', 'Carrossel', 'Foto estática']

const NUM_FIELDS = [
  { key: 'contas_alcancadas', label: 'Contas alcançadas', highlight: true },
  { key: 'visualizacoes',     label: 'Visualizações' },
  { key: 'interacoes',        label: 'Interações (total)' },
  { key: 'curtidas',          label: 'Curtidas' },
  { key: 'comentarios',       label: 'Comentários' },
  { key: 'salvamentos',       label: 'Salvamentos' },
  { key: 'compartilhamentos', label: 'Compartilhamentos' },
]

const input = (highlight) => ({
  width: '100%',
  border: `1.5px solid ${highlight ? 'rgba(195,235,247,0.9)' : '#E8ECF0'}`,
  borderRadius: 9, padding: '8px 12px', fontSize: 13,
  outline: 'none', color: '#1C252E', fontFamily: 'DM Sans, sans-serif',
  background: highlight ? 'rgba(195,235,247,0.06)' : '#fff',
})

function fileToName(filename) {
  if (!filename) return ''
  return filename
    .replace(/\.[^/.]+$/, '')        // remove extensão
    .replace(/[-_]/g, ' ')           // hífens e underscores → espaço
    .replace(/\b\w/g, c => c.toUpperCase()) // capitaliza palavras
    .trim()
}

const EMPTY = {
  nome: '', data_post: '', tipo: 'Reels', descricao: '',
  contas_alcancadas: '', visualizacoes: '', interacoes: '',
  curtidas: '', comentarios: '', salvamentos: '', compartilhamentos: '',
  status: 'parcial',
}

export default function UploadModal({ mode = 'new', post = null, onClose, onSave }) {
  const { apiKey } = useStore()
  const [preview,  setPreview]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [saved,    setSaved]    = useState(false)
  const [dragging, setDragging] = useState(false)
  const [form, setForm] = useState(
    post ? { ...EMPTY, ...post } : { ...EMPTY }
  )

  function handleFile(file) {
    if (!file) return
    // pré-preenche nome pelo nome do arquivo (se campo ainda vazio)
    if (!form.nome) {
      setForm(f => ({ ...f, nome: fileToName(file.name) }))
    }
    const r = new FileReader()
    r.onload = e => { setPreview(e.target.result); setError(null) }
    r.readAsDataURL(file)
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
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
      // mantém nome e descricao que o usuário pode ter editado; preenche o resto
      setForm(f => ({
        ...f,
        data_post:        data.data_post        ?? f.data_post,
        tipo:             data.tipo             ?? f.tipo,
        contas_alcancadas: data.contas_alcancadas ?? f.contas_alcancadas,
        visualizacoes:    data.visualizacoes    ?? f.visualizacoes,
        interacoes:       data.interacoes       ?? f.interacoes,
        curtidas:         data.curtidas         ?? f.curtidas,
        comentarios:      data.comentarios      ?? f.comentarios,
        salvamentos:      data.salvamentos      ?? f.salvamentos,
        compartilhamentos:data.compartilhamentos ?? f.compartilhamentos,
      }))
    } catch (e) {
      setError('Não foi possível extrair os dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function save() {
    const dados = {
      ...form,
      tema: form.nome || form.tema || '',   // compatibilidade com componentes que usam "tema"
      ...Object.fromEntries(
        NUM_FIELDS.map(({ key }) => [key, Number(form[key]) || null])
      ),
    }
    onSave(dados); setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.65)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
        maxHeight: '92vh', overflow: 'auto', boxShadow: '0 16px 56px rgba(0,0,0,0.22)',
      }} className="scrollbar-thin">

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
          <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>
            {mode === 'update' ? 'Atualizar post' : 'Novo post'}
          </h2>
          <button onClick={onClose} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#8A9BB0" />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('_file_inp').click()}
            style={{
              border: `2px dashed ${dragging ? '#C3EBF7' : '#D8EEF6'}`,
              borderRadius: 12, padding: preview ? '12px 14px' : '20px 14px',
              cursor: 'pointer', background: dragging ? '#F0F8FF' : '#FAFCFE',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <input id="_file_inp" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              <>
                <img src={preview} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#1C252E', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Print carregado</p>
                  <p style={{ color: '#8A9BB0', fontSize: 12 }}>Clique para trocar a imagem</p>
                </div>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <Upload size={22} color="#C3EBF7" style={{ margin: '0 auto 6px' }} />
                <p style={{ color: '#8A9BB0', fontSize: 13 }}>Arraste o print ou clique para selecionar</p>
                <p style={{ color: '#B0BEC5', fontSize: 11, marginTop: 3 }}>O nome do arquivo será usado como título do post</p>
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
              {loading ? 'Extraindo dados da imagem...' : 'Extrair métricas automaticamente'}
            </button>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px' }}>
              <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>
            </div>
          )}

          {/* ── NOME DO POST (campo principal) ── */}
          <div>
            <label style={{ color: '#1C252E', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>
              Nome do post <span style={{ color: '#8A9BB0', fontWeight: 400 }}>(título para identificação)</span>
            </label>
            <input
              value={form.nome || ''}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Caique Cardoso — ETFs Itaú Asset"
              style={{ ...input(false), fontSize: 14, padding: '10px 12px', border: '1.5px solid #1C252E30' }}
              autoFocus={mode === 'new'}
            />
          </div>

          {/* Descrição livre */}
          <div>
            <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Descrição / Observações
            </label>
            <textarea
              value={form.descricao || ''}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
              placeholder="Contexto do post, tema, campanha, etc."
              style={{ ...input(false), resize: 'vertical' }}
            />
          </div>

          {/* Data + Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</label>
              <input value={form.data_post || ''} onChange={e => set('data_post', e.target.value)}
                placeholder="DD/MM/AAAA" style={input(false)} />
            </div>
            <div>
              <label style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo</label>
              <select value={form.tipo || 'Reels'} onChange={e => set('tipo', e.target.value)}
                style={{ ...input(false), background: '#fff' }}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Métricas numéricas */}
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
                    display: 'block', marginBottom: 4,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {label}
                  </label>
                  <input
                    type="number"
                    value={form[key] === null || form[key] === undefined ? '' : form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder="—"
                    style={{ ...input(!!highlight), fontSize: highlight ? 15 : 13, fontWeight: highlight ? 700 : 400 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#8A9BB0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status:
            </span>
            {['parcial', 'final'].map(s => (
              <button key={s} onClick={() => set('status', s)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: form.status === s
                  ? (s === 'final' ? '#1C252E' : 'rgba(195,235,247,0.35)')
                  : '#F4F6F8',
                color: form.status === s
                  ? (s === 'final' ? '#C3EBF7' : '#1a7a96')
                  : '#8A9BB0',
                border: form.status === s && s === 'parcial'
                  ? '1px solid rgba(195,235,247,0.7)' : '1px solid transparent',
              }}>
                {s === 'parcial' ? '🕐 Dado parcial' : '✓ Dado final'}
              </button>
            ))}
          </div>

          {/* Salvar */}
          <button onClick={save} style={{
            width: '100%', background: saved ? '#22c55e' : '#1C252E',
            color: saved ? '#fff' : '#C3EBF7', border: 'none', borderRadius: 12,
            padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}>
            {saved
              ? <><Check size={16} /> Salvo!</>
              : (mode === 'update' ? 'Atualizar post' : 'Salvar post')}
          </button>
        </div>
      </div>
    </div>
  )
}
