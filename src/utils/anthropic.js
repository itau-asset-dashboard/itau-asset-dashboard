// ── Helper: extrai JSON de uma resposta livre do modelo ────────────────────
function parseJsonResponse(text) {
  const cleaned = text.replace(/```json|```/g, '').trim()

  // 1ª tentativa: parse direto
  try { return JSON.parse(cleaned) } catch (_) {}

  // 2ª tentativa: pega o primeiro bloco { ... } ou [ ... ]
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (match) {
    try { return JSON.parse(match[0]) } catch (_) {}
  }

  console.error('[anthropic] resposta inesperada:', text)
  throw new Error('O modelo não retornou um JSON válido. Veja o console para detalhes.')
}

export async function extractPostFromImage(base64, mediaType, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Você é um assistente que extrai dados de prints de métricas do Instagram.
A imagem pode estar em diferentes formatos:

FORMATO DESKTOP (painel web do Instagram/Meta Business Suite):
  Métricas com rótulos de texto visíveis: "Contas alcançadas", "Visualizações", "Curtidas", "Comentários", "Compartilhamentos", "Salvamentos".

FORMATO MOBILE — TELA DE INSIGHTS DO POST (app Instagram):
  Há duas sub-variações:
  a) Tela de insights detalhados: mostra cards/blocos com os valores de "Contas alcançadas", "Impressões" ou "Visualizações", e seções de engajamento com os números de curtidas, comentários, salvamentos e compartilhamentos escritos por extenso ou com ícone + número.
  b) Tela resumida abaixo do post: ícones em linha — coração (♡/❤) = curtidas, balão de fala = comentários, avião de papel ou seta = compartilhamentos, marcador/bookmark = salvamentos. Abaixo aparecem cards "Visualizações" e "Contas alcançadas".

FORMATO MOBILE — FEED/PERFIL:
  Pode mostrar apenas o número de curtidas abaixo da imagem. Extraia o que estiver visível.

Independente do formato, procure qualquer número associado a:
  - alcance / contas alcançadas / accounts reached
  - impressões / visualizações / views / impressions
  - curtidas / likes / ❤
  - comentários / comments
  - salvamentos / saves / bookmarks
  - compartilhamentos / shares / reposts

Retorne APENAS um JSON válido (sem markdown, sem texto fora do JSON):
{
  "data_post": "DD/MM/AAAA ou null",
  "tipo": "Carrossel | Reels | Foto estática",
  "contas_alcancadas": número inteiro ou null,
  "visualizacoes": número inteiro ou null,
  "curtidas": número inteiro ou null,
  "comentarios": número inteiro ou null,
  "salvamentos": número inteiro ou null,
  "compartilhamentos": número inteiro ou null
}
Use null para qualquer campo não encontrado. Não invente valores.`
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro ${response.status}`)
  }

  const data = await response.json()
  return parseJsonResponse(data.content?.[0]?.text || '')
}

export async function generateInsights(posts, apiKey) {
  const resumo = posts.map(p => ({
    data: p.data_post,
    tipo: p.tipo,
    tema: p.tema,
    contas_alcancadas: p.contas_alcancadas,
    curtidas: p.curtidas,
    comentarios: p.comentarios,
    salvamentos: p.salvamentos,
    compartilhamentos: p.compartilhamentos,
    status: p.status,
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é um analista de redes sociais especializado em finanças e investimentos.
Analise os dados de posts do Instagram abaixo e gere EXATAMENTE 4 insights estratégicos em português brasileiro.

Dados dos posts:
${JSON.stringify(resumo, null, 2)}

Cubra obrigatoriamente esses 4 ângulos (um insight por ângulo):
1. Qual tipo de post (Carrossel, Reels, Foto estática) performa melhor em contas alcançadas
2. Qual tema tem maior alcance médio
3. Tendência de contas alcançadas ao longo do tempo
4. Recomendação prioritária para maximizar o alcance no próximo mês

Retorne APENAS um JSON válido com exatamente 4 objetos (sem markdown, sem texto fora do JSON):
[
  { "icone": "📈", "titulo": "título curto", "texto": "insight detalhado em 2-3 frases" },
  ...
]`
      }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro ${response.status}`)
  }

  const data = await response.json()
  return parseJsonResponse(data.content?.[0]?.text || '')
}

export async function chatWithData(messages, posts, metaMensal, metaAnual, mesFiltro, apiKey) {
  const resumo = posts.map(p => ({
    nome: p.nome,
    data: p.data_post,
    tipo: p.tipo,
    tema: Array.isArray(p.tema) ? p.tema.join(', ') : p.tema,
    contas_alcancadas: p.contas_alcancadas,
    visualizacoes: p.visualizacoes,
    curtidas: p.curtidas,
    comentarios: p.comentarios,
    salvamentos: p.salvamentos,
    compartilhamentos: p.compartilhamentos,
    status: p.status,
  }))

  const systemPrompt = `Você é uma especialista sênior em redes sociais para o mercado financeiro, responsável pela performance do Instagram @itauasset da Itaú Asset Management.

Você tem acesso completo aos dados de performance do dashboard e responde com profundidade analítica, como uma consultora que conhece cada post, cada número e o contexto do mercado financeiro.

CONTEXTO DO DASHBOARD:
- Período filtrado: ${mesFiltro}
- Meta mensal ajustada: ${metaMensal?.toLocaleString('pt-BR')} contas alcançadas
- Meta anual: ${metaAnual?.toLocaleString('pt-BR')} contas alcançadas
- Posts na base: ${posts.length}

DADOS DOS POSTS:
${JSON.stringify(resumo, null, 2)}

DIRETRIZES DE RESPOSTA:
- Use **negrito** para destacar dados importantes, nomes de posts e conclusões
- Use listas com tópicos (-) para enumerar pontos e comparações
- Use numeração (1. 2. 3.) para recomendações em ordem de prioridade
- Estruture com títulos (## Título) quando a resposta tiver seções distintas
- Seja direta e analítica: cite números reais, compare posts, identifique padrões
- Termine com uma recomendação prática quando fizer sentido
- Use formatação brasileira para números (vírgula decimal, ponto para milhar)
- Escreva em português brasileiro com tom profissional mas acessível`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}
