import { RefreshCw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { generateInsights } from '../utils/anthropic'

const DEFAULT = [
  { icone:'📈', titulo:'Configure sua chave de API', texto:'Clique em "API ativa" na barra superior para inserir sua chave Anthropic e ativar insights automáticos.' },
  { icone:'📊', titulo:'Dados prontos para análise',  texto:'Com pelo menos 2 posts cadastrados, você pode gerar análise completa de performance e recomendações estratégicas.' },
  { icone:'💡', titulo:'Dica de upload',              texto:'Use o botão "Novo post" no painel lateral para adicionar prints de métricas diretamente do Instagram.' },
]

export default function Insights() {
  const { insights, loadingInsights, setInsights, setLoadingInsights, apiKey, getPostsDoMes } = useStore()
  const posts = getPostsDoMes()

  async function generate() {
    if (!apiKey) { alert('Configure sua chave da API Anthropic primeiro.'); return }
    if (posts.length<2) { alert('Adicione pelo menos 2 posts para gerar insights.'); return }
    setLoadingInsights(true)
    try { setInsights(await generateInsights(posts, apiKey)) }
    catch(e) { alert('Não foi possível gerar insights: '+e.message) }
    finally { setLoadingInsights(false) }
  }

  const list = insights.length>0 ? insights : DEFAULT

  return (
    <div style={{ paddingTop:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Insights automáticos</h2>
          <p style={{ color:'#8A9BB0', fontSize:12, marginTop:2 }}>Análise inteligente via IA</p>
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
          {loadingInsights?'Gerando...':'Gerar insights'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:12 }}>
        {list.map((ins,i)=>(
          <div key={i} className="card" style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:'rgba(195,235,247,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>
                {ins.icone}
              </div>
              <div>
                <p style={{ color:'#1C252E', fontWeight:600, fontSize:13, marginBottom:5 }}>{ins.titulo}</p>
                <p style={{ color:'#8A9BB0', fontSize:12, lineHeight:1.65 }}>{ins.texto}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
