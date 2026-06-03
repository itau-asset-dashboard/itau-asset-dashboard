import { useRef, useEffect, useState } from 'react'
import { RefreshCw, Send, Trash2 } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

// Renderer simples de markdown para respostas da IA
function MarkdownText({ text }) {
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />

        // Título ## ou ###
        if (line.startsWith('## ') || line.startsWith('### ')) {
          const t = line.replace(/^#{2,3}\s/, '')
          return <p key={i} style={{ fontWeight: 700, fontSize: 13, color: '#182638', marginTop: 6 }}>{renderInline(t)}</p>
        }

        // Bullet — ou *
        if (/^[-*•]\s/.test(line)) {
          const t = line.replace(/^[-*•]\s/, '')
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#F97316', fontWeight: 800, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>·</span>
              <span style={{ fontSize: 13, lineHeight: 1.6 }}>{renderInline(t)}</span>
            </div>
          )
        }

        // Linha numerada 1.
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1]
          const t = line.replace(/^\d+\.\s/, '')
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#F97316', fontWeight: 700, fontSize: 12, lineHeight: 1.7, flexShrink: 0, minWidth: 16 }}>{num}.</span>
              <span style={{ fontSize: 13, lineHeight: 1.6 }}>{renderInline(t)}</span>
            </div>
          )
        }

        return <p key={i} style={{ fontSize: 13, lineHeight: 1.65 }}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  // **negrito**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700, color: '#182638' }}>{p.slice(2, -2)}</strong>
      : p
  )
}
import { useStore } from '../store/useStore'
import { generateInsights, chatWithData } from '../utils/anthropic'

const DEFAULT = [
  { icone:'🔑', titulo:'Configure sua chave de API',     texto:'Clique no ícone de chave na barra superior para inserir sua chave Anthropic e ativar insights automáticos.' },
  { icone:'📊', titulo:'Dados prontos para análise',     texto:'Com pelo menos 2 posts cadastrados, você pode gerar análise completa de performance e recomendações estratégicas.' },
  { icone:'📈', titulo:'Acompanhe sua meta mensal',      texto:'Na Visão Anual você encontra a meta ajustada mês a mês com base no saldo acumulado do ano.' },
  { icone:'🎯', titulo:'Top posts por mês',              texto:'Na Visão Mensal você vê o ranking dos 5 melhores posts do período com medalhas e barras de progresso.' },
]

const SUGESTOES = [
  'Qual foi o post com mais alcance?',
  'Como estamos em relação à meta mensal?',
  'Qual tipo de post performa melhor?',
  'Quais temas têm mais engajamento?',
  'Que dia da semana costuma ir melhor?',
]

export default function Insights() {
  const { insights, loadingInsights, setInsights, setLoadingInsights, apiKey, posts, metaMensal, metaAnual, mesFiltro } = useStore()

  // ── Insights automáticos ──────────────────────────────
  const allPosts = posts

  async function generate() {
    if (!apiKey) { alert('Configure sua chave da API Anthropic primeiro.'); return }
    if (allPosts.length < 2) { alert('Adicione pelo menos 2 posts para gerar insights.'); return }
    setLoadingInsights(true)
    try { setInsights(await generateInsights(allPosts, apiKey)) }
    catch(e) { alert('Não foi possível gerar insights: ' + e.message) }
    finally { setLoadingInsights(false) }
  }

  const list = insights.length > 0 ? insights : DEFAULT
  const mobile = useIsMobile()

  // ── Chat ──────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([]) // { role: 'user'|'assistant', content: string }
  const [input, setInput]               = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const [chatError, setChatError]       = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  async function sendMessage(text) {
    const msg = (text || input).trim()
    if (!msg) return
    if (!apiKey) { setChatError('Configure a chave de API Anthropic primeiro.'); return }

    const updated = [...chatMessages, { role: 'user', content: msg }]
    setChatMessages(updated)
    setInput('')
    setChatLoading(true)
    setChatError(null)

    try {
      const reply = await chatWithData(updated, allPosts, metaMensal, metaAnual, mesFiltro, apiKey)
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch(e) {
      setChatError('Erro ao obter resposta: ' + e.message)
    } finally {
      setChatLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function clearChat() {
    setChatMessages([])
    setChatError(null)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Insights automáticos ── */}
      <div>
        <div style={{ display:'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', justifyContent:'space-between', gap: mobile ? 10 : 0, marginBottom:16 }}>
          <div>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Insights automáticos</h2>
            <p style={{ color:'#8A9BB0', fontSize:12, marginTop:2 }}>Análise inteligente via IA · baseada em todos os posts</p>
          </div>
          <button onClick={generate} disabled={loadingInsights}
            style={{
              background:'#1C252E', color:'#C3EBF7',
              border:'1.5px solid rgba(195,235,247,0.2)',
              borderRadius:10, padding:'8px 16px', cursor:loadingInsights?'not-allowed':'pointer',
              fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6,
              opacity:loadingInsights?0.7:1,
            }}>
            <RefreshCw size={13} style={{ animation:loadingInsights?'spin 1s linear infinite':undefined }}/>
            {loadingInsights ? 'Gerando...' : 'Gerar insights'}
          </button>
        </div>

        <div className="insights-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:12 }}>
          {list.map((ins,i) => (
            <div key={i} className="card" style={{ padding:'18px 20px' }}>
              <p style={{ color:'#182638', fontWeight:600, fontSize:13, marginBottom:6 }}>{ins.titulo}</p>
              <p style={{ color:'#8A9BB0', fontSize:12, lineHeight:1.65 }}>{ins.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>

        {/* Header do chat */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #F0F4F8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Logo Itaú — bolinha azul claro com superelipse escura */}
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background:'#C3EBF7',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>
                <svg width={22} height={22} viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" rx="26" fill="#182638"/>
                  <text x="50" y="68" textAnchor="middle"
                    fontFamily="'Nunito','DM Sans',sans-serif"
                    fontWeight="900" fontSize="38" fill="#C3EBF7" letterSpacing="-1">
                    itaú
                  </text>
                </svg>
              </div>
              <h2 style={{ color:'#182638', fontSize:15, fontWeight:700, margin:0 }}>Converse com a IAsset</h2>
            </div>
            <p style={{ color:'#8A9BB0', fontSize:12, marginTop:4 }}>Pergunte sobre performance, posts e tendências</p>
          </div>
          {chatMessages.length > 0 && (
            <button onClick={clearChat}
              style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:'6px 10px',
                cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                color:'#8A9BB0', fontSize:12 }}>
              <Trash2 size={12}/> Limpar
            </button>
          )}
        </div>

        {/* Mensagens */}
        <div className="chat-messages scrollbar-thin" style={{ minHeight:200, maxHeight:420, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>

          {chatMessages.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <p style={{ color:'#9AAAB8', fontSize:13, marginBottom:4 }}>Sugestões de perguntas:</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {SUGESTOES.map((s,i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{
                      background:'rgba(195,235,247,0.2)', border:'1px solid rgba(195,235,247,0.6)',
                      borderRadius:20, padding:'6px 14px', cursor:'pointer',
                      color:'#1a7a96', fontSize:12, fontFamily:'DM Sans, sans-serif',
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(195,235,247,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(195,235,247,0.2)'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((m, i) => (
            <div key={i} style={{
              display:'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: m.role === 'user' ? '75%' : '90%',
                background: m.role === 'user' ? '#182638' : '#F4F8FB',
                color: m.role === 'user' ? '#C3EBF7' : '#3D4E5C',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: m.role === 'user' ? '10px 14px' : '14px 16px',
                fontSize:13, lineHeight:1.6,
                border: m.role === 'assistant' ? '1px solid #E8EDF2' : 'none',
              }}>
                {m.role === 'user'
                  ? <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                  : <MarkdownText text={m.content} />
                }
              </div>
            </div>
          ))}

          {chatLoading && (
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{ background:'#F4F8FB', borderRadius:'16px 16px 16px 4px', padding:'10px 16px' }}>
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{
                      width:6, height:6, borderRadius:'50%', background:'#9AAAB8',
                      animation:'bounce 1.2s ease-in-out infinite',
                      animationDelay:`${j * 0.2}s`,
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatError && (
            <p style={{ color:'#ef4444', fontSize:12, textAlign:'center' }}>{chatError}</p>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid #F0F4F8', display:'flex', gap:8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Pergunte algo para a IAsset..."
            style={{
              flex:1, border:'1.5px solid #E8ECF0', borderRadius:10,
              padding:'9px 13px', fontSize:13, outline:'none',
              color:'#1C252E', fontFamily:'DM Sans, sans-serif',
              background:'#FAFCFE',
            }}
            onFocus={e => e.target.style.borderColor='#C3EBF7'}
            onBlur={e => e.target.style.borderColor='#E8ECF0'}
          />
          <button onClick={() => sendMessage()} disabled={chatLoading || !input.trim()}
            style={{
              background: chatLoading || !input.trim() ? '#E8ECF0' : '#1C252E',
              border:'none', borderRadius:10, padding:'9px 14px',
              cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background 0.15s',
            }}>
            <Send size={15} color={chatLoading || !input.trim() ? '#9AAAB8' : '#C3EBF7'}/>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
