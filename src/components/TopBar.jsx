import { useState } from 'react'
import { Download, Key, Plus, Lock, Unlock, Eye } from 'lucide-react'
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
  'posts':        { title: 'Todos os Posts',     sub: 'Histórico completo de publicações' },
  'insights':     { title: 'Insights',           sub: 'Análise inteligente de performance' },
  'upload':       { title: 'Upload',             sub: 'Adicionar post com extração automática' },
}

const EDIT_PASSWORD = import.meta.env.VITE_EDIT_PASSWORD || 'itauasset2026'

export default function TopBar() {
  const { mesFiltro, setMesFiltro, apiKey, setApiKey, getPostsDoMes, activeSection, addPost, isEditMode, setEditMode } = useStore()
  const [showApi, setShowApi]         = useState(false)
  const [keyInput, setKeyInput]       = useState(apiKey)
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [showLock, setShowLock]       = useState(false)
  const [pwInput, setPwInput]         = useState('')
  const [pwError, setPwError]         = useState(false)

  const posts = getPostsDoMes()
  const section = TITLES[activeSection] || TITLES['visao-anual']
  const showMesFiltro = activeSection === 'visao-geral' || activeSection === 'posts' || activeSection === 'insights'

  function exportCSV() {
    const headers = ['Data','Tipo','Tema','Contas Alcançadas','Visualizações','Curtidas','Comentários','Salvamentos','Compartilhamentos','Status']
    const rows = posts.map(p => [p.data_post,p.tipo,p.tema,p.contas_alcancadas,p.visualizacoes,p.curtidas,p.comentarios,p.salvamentos,p.compartilhamentos,p.status])
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c??''}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`instagram-${mesFiltro?.replace('/','_')}.csv`})
    a.click()
  }

  function handleUnlock() {
    if (pwInput === EDIT_PASSWORD) {
      setEditMode(true)
      setShowLock(false)
      setPwInput('')
      setPwError(false)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  function handleLock() {
    setEditMode(false)
    setShowLock(false)
  }

  return (
    <div className="topbar-root" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 24px', gap: 8, flexShrink: 0,
      background: '#fff', borderBottom: '1px solid #EDEFF2',
    }}>
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 className="topbar-title" style={{ color: '#182638', fontSize: 18, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section.title}</h1>
          <p className="topbar-sub" style={{ color: '#A8B5C0', fontSize: 12, marginTop: 1 }}>{section.sub}</p>
        </div>
        {/* Badge de modo */}
        {!isEditMode && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(195,235,247,0.3)', color: '#1a7a96',
            border: '1px solid rgba(195,235,247,0.8)',
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            <Eye size={11} /> <span className="hide-mobile">Visualização</span>
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {showMesFiltro && (
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#1C252E', cursor: 'pointer', outline: 'none', fontFamily: 'DM Sans, sans-serif', maxWidth: 140 }}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}

        {/* Novo post — só no modo edição */}
        {isEditMode && (
          <button onClick={() => setUploadOpen(true)} style={{
            background: '#F97316', color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
          }}>
            <Plus size={15} /> <span className="hide-mobile">Novo post</span>
          </button>
        )}

        {/* API — só no modo edição */}
        {isEditMode && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowApi(v => !v)}
              title={apiKey ? 'API ativa' : 'Sem API — clique para configurar'}
              style={{
                background: '#fff',
                border: `1.5px solid ${apiKey ? '#EDEFF2' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 10, padding: '7px 9px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: apiKey ? '#4A5568' : '#ef4444',
              }}>
              <Key size={14} />
            </button>
            {showApi && (
              <div style={{
                position: 'fixed', top: 56, right: 12,
                background: '#fff', border: '1px solid #EAECF0', borderRadius: 14,
                padding: 16, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                width: 'min(290px, calc(100vw - 24px))',
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
        )}

        {/* CSV */}
        <button onClick={exportCSV} title="Exportar CSV"
          style={{
            background: '#fff', border: '1.5px solid #EDEFF2', borderRadius: 10,
            padding: '7px 9px', color: '#4A5568', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Download size={14} />
        </button>

        {/* Botão cadeado */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowLock(v => !v); setPwInput(''); setPwError(false) }}
            title={isEditMode ? 'Sair do modo edição' : 'Entrar no modo edição'}
            style={{
              background: isEditMode ? 'rgba(249,115,22,0.08)' : '#F4F6F8',
              border: `1.5px solid ${isEditMode ? 'rgba(249,115,22,0.3)' : '#EDEFF2'}`,
              borderRadius: 10, padding: '7px 9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isEditMode ? '#F97316' : '#8A9BB0',
            }}>
            {isEditMode ? <Unlock size={14} /> : <Lock size={14} />}
          </button>

          {showLock && (
            <div style={{
              position: 'fixed', top: 56, right: 12,
              background: '#fff', border: '1px solid #EAECF0', borderRadius: 14,
              padding: 20, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              width: 'min(300px, calc(100vw - 24px))',
            }}>
              {isEditMode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Unlock size={16} color="#F97316" />
                    </div>
                    <div>
                      <p style={{ color: '#182638', fontSize: 13, fontWeight: 700 }}>Modo edição ativo</p>
                      <p style={{ color: '#8A9BB0', fontSize: 12 }}>Voltar para visualização?</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowLock(false)}
                      style={{ flex: 1, background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer', color: '#4A5568', fontFamily: 'DM Sans, sans-serif' }}>
                      Cancelar
                    </button>
                    <button onClick={handleLock}
                      style={{ flex: 1, background: '#1C252E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Bloquear
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={16} color="#8A9BB0" />
                    </div>
                    <div>
                      <p style={{ color: '#182638', fontSize: 13, fontWeight: 700 }}>Modo edição</p>
                      <p style={{ color: '#8A9BB0', fontSize: 12 }}>Digite a senha para continuar</p>
                    </div>
                  </div>
                  <input
                    type="password"
                    value={pwInput}
                    onChange={e => { setPwInput(e.target.value); setPwError(false) }}
                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                    placeholder="Senha"
                    autoFocus
                    style={{
                      width: '100%', border: `1.5px solid ${pwError ? '#ef4444' : '#EAECF0'}`,
                      borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
                      fontFamily: 'DM Sans, sans-serif', marginBottom: 6,
                      transition: 'border-color 0.15s',
                    }}
                  />
                  {pwError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>Senha incorreta. Tente novamente.</p>}
                  <button onClick={handleUnlock}
                    style={{ width: '100%', background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: pwError ? 0 : 6 }}>
                    Entrar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {uploadOpen && isEditMode && (
        <UploadModal mode="new" onClose={() => setUploadOpen(false)}
          onSave={dados => addPost(dados)} />
      )}
    </div>
  )
}
