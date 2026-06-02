import { useState } from 'react'
import { Download, Key, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const MESES = Array.from({ length: 12 }, (_, i) => ({
  value: `${String(i + 1).padStart(2, '0')}/2026`,
  label: `${MESES_NOMES[i]} 2026`,
}))

const TITLES = {
  'visao-anual':  { title: 'Visão Anual 2026',  sub: 'Performance consolidada do ano' },
  'visao-geral':  { title: 'Visão Mensal',       sub: 'Métricas de alcance do mês filtrado' },
  'posts':        { title: 'Todos os Posts',     sub: 'Clique em qualquer linha para editar' },
  'insights':     { title: 'Insights',           sub: 'Análise inteligente de performance' },
  'upload':       { title: 'Upload',             sub: 'Adicionar post com extração automática' },
}

export default function TopBar() {
  const { mesFiltro, setMesFiltro, apiKey, setApiKey, getPostsDoMes, activeSection, addPost } = useStore()
  const [showApi, setShowApi]       = useState(false)
  const [keyInput, setKeyInput]     = useState(apiKey)
  const [uploadOpen, setUploadOpen] = useState(false)
  const posts = getPostsDoMes()
  const section = TITLES[activeSection] || TITLES['visao-anual']
  const showMesFiltro = activeSection === 'visao-geral' || activeSection === 'insights'

  function exportCSV() {
    const headers = ['Data','Tipo','Tema','Contas Alcançadas','Visualizações','Curtidas','Comentários','Salvamentos','Compartilhamentos','Status']
    const rows = posts.map(p => [p.data_post,p.tipo,p.tema,p.contas_alcancadas,p.visualizacoes,p.curtidas,p.comentarios,p.salvamentos,p.compartilhamentos,p.status])
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c??''}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`instagram-${mesFiltro?.replace('/','_')}.csv`})
    a.click()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', gap: 12, flexShrink: 0,
      background: '#fff', borderBottom: '1px solid #EAECF0',
    }}>
      <div>
        <h1 style={{ color: '#1C252E', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{section.title}</h1>
        <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 2 }}>{section.sub}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showMesFiltro && (
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EAECF0', borderRadius: 10, padding: '7px 12px', fontSize: 13, color: '#1C252E', cursor: 'pointer', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}

        {/* Novo post — botão principal */}
        <button onClick={() => setUploadOpen(true)} style={{
          background: '#FF6200', color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif',
        }}>
          <Plus size={15} /> Novo post
        </button>

        {/* API */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowApi(v => !v)} style={{
            background: apiKey ? 'rgba(195,235,247,0.3)' : 'rgba(239,68,68,0.07)',
            border: `1.5px solid ${apiKey ? 'rgba(195,235,247,0.8)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 500,
            color: apiKey ? '#0E7490' : '#ef4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif',
          }}>
            <Key size={13} />
            <span className="hide-mobile">{apiKey ? 'API ativa' : 'Sem API'}</span>
          </button>
          {showApi && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1px solid #EAECF0', borderRadius: 14,
              padding: 16, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: 290,
            }}>
              <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Chave da API Anthropic</p>
              <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{ width: '100%', border: '1.5px solid #EAECF0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
              <button onClick={() => { setApiKey(keyInput); setShowApi(false) }}
                style={{ marginTop: 10, width: '100%', background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Salvar
              </button>
            </div>
          )}
        </div>

        {/* CSV */}
        <button onClick={exportCSV} style={{
          background: '#fff', border: '1.5px solid #EAECF0', borderRadius: 10,
          padding: '7px 12px', fontSize: 13, color: '#9AAAB8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif',
        }}>
          <Download size={13} />
          <span className="hide-mobile">CSV</span>
        </button>
      </div>

      {uploadOpen && (
        <UploadModal mode="new" onClose={() => setUploadOpen(false)}
          onSave={dados => addPost(dados)} />
      )}
    </div>
  )
}
