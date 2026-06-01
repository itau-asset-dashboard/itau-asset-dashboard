import { useState } from 'react'
import { Download, Key } from 'lucide-react'
import { useStore } from '../store/useStore'

const MESES = [
  '01/2025','02/2025','03/2025','04/2025','05/2025','06/2025',
  '07/2025','08/2025','09/2025','10/2025','11/2025','12/2025',
  '01/2026','02/2026','03/2026','04/2026','05/2026','06/2026',
]

const TITLES = {
  'visao-geral': { title: 'Visão Geral',  sub: 'Métricas de alcance do Instagram' },
  'posts':       { title: 'Posts',        sub: 'Ranking e gestão de publicações' },
  'insights':    { title: 'Insights',     sub: 'Análise inteligente de performance' },
  'upload':      { title: 'Upload',       sub: 'Adicionar post com extração automática' },
}

const btn = {
  base: {
    border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
  },
}

export default function TopBar() {
  const { mesFiltro, setMesFiltro, apiKey, setApiKey, getPostsDoMes, activeSection } = useStore()
  const [showApi, setShowApi] = useState(false)
  const [keyInput, setKeyInput] = useState(apiKey)
  const posts = getPostsDoMes()
  const section = TITLES[activeSection] || TITLES['visao-geral']

  function exportCSV() {
    const headers = ['Data','Tipo','Tema','Contas Alcançadas','Visualizações','Curtidas','Comentários','Salvamentos','Compartilhamentos','Status','Última Atualização']
    const rows = posts.map(p => [p.data_post,p.tipo,p.tema,p.contas_alcancadas,p.visualizacoes,p.curtidas,p.comentarios,p.salvamentos,p.compartilhamentos,p.status,p.atualizado_em||''])
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c??''}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`instagram-${mesFiltro?.replace('/','_')}.csv`})
    a.click()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px 12px', gap: 12, flexShrink: 0,
      background: '#fff', borderBottom: '1px solid #E8ECF0',
    }}>
      <div>
        <h1 style={{ color: '#1C252E', fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{section.title}</h1>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 1 }}>{section.sub}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Mês */}
        <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
          style={{ ...btn.base, background: '#fff', border: '1.5px solid #E8ECF0', color: '#1C252E', padding: '7px 12px' }}>
          {MESES.map(m => <option key={m}>{m}</option>)}
        </select>

        {/* API */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowApi(v => !v)}
            style={{
              ...btn.base,
              background: apiKey ? 'rgba(195,235,247,0.35)' : 'rgba(239,68,68,0.07)',
              border: `1.5px solid ${apiKey ? 'rgba(195,235,247,0.9)' : 'rgba(239,68,68,0.25)'}`,
              color: apiKey ? '#1a7a96' : '#ef4444',
            }}>
            <Key size={13} />
            {apiKey ? 'API ativa' : 'Sem API'}
          </button>
          {showApi && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: '#fff', border: '1px solid #E8ECF0', borderRadius: 14,
              padding: 16, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: 290,
            }}>
              <p style={{ color: '#1C252E', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Chave da API Anthropic</p>
              <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{ width: '100%', border: '1.5px solid #E8ECF0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
              <button onClick={() => { setApiKey(keyInput); setShowApi(false) }}
                style={{ ...btn.base, marginTop: 10, width: '100%', justifyContent: 'center', background: '#1C252E', color: '#C3EBF7', fontWeight: 600 }}>
                Salvar
              </button>
            </div>
          )}
        </div>

        {/* CSV */}
        <button onClick={exportCSV}
          style={{ ...btn.base, background: '#fff', border: '1.5px solid #E8ECF0', color: '#8A9BB0' }}>
          <Download size={13} /> CSV
        </button>
      </div>
    </div>
  )
}
