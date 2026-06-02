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
A imagem pode estar em dois formatos:

FORMATO DESKTOP (painel web): métricas com rótulos de texto como "Contas alcançadas", "Visualizações", "Curtidas", etc.

FORMATO MOBILE (app do Instagram): ícones em linha abaixo do post, da esquerda para direita:
  - Coração (♡) = curtidas
  - Balão de fala = comentários
  - Seta circular / repost = compartilhamentos (reposts)
  - Avião de papel / encaminhar = também pode ser compartilhamentos
  - Marcador/bookmark = salvamentos
  Abaixo dos ícones aparecem cards com "Visualizações" e "Contas alcançadas" em destaque.
  Pode haver também "Tempo médio de visualização" e "Seguidores" — ignore esses dois.

Leia a imagem e retorne APENAS um JSON válido (sem markdown, sem explicação, sem bloco de código):
{
  "data_post": "DD/MM/AAAA ou null — procure datas no print ou no conteúdo do post",
  "tipo": "Carrossel | Reels | Foto estática — Reels se for vídeo/reel, Carrossel se múltiplos slides, Foto estática se imagem única",
  "contas_alcancadas": número inteiro ou null,
  "visualizacoes": número inteiro ou null,
  "interacoes": número inteiro (total de interações, se explícito) ou null,
  "curtidas": número inteiro ou null,
  "comentarios": número inteiro ou null,
  "salvamentos": número inteiro ou null,
  "compartilhamentos": número inteiro ou null
}
Importante: extraia apenas números explicitamente visíveis. Não some nem calcule — use null se não encontrar.`
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
  const text = data.content?.[0]?.text || ''
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
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
Analise os dados de posts do Instagram abaixo e gere EXATAMENTE 8 insights estratégicos em português brasileiro.

Dados dos posts:
${JSON.stringify(resumo, null, 2)}

Cubra obrigatoriamente esses 8 ângulos (um insight por ângulo):
1. Qual tipo de post (Carrossel, Reels, Foto estática) performa melhor em contas alcançadas
2. Qual tema tem maior alcance médio
3. Tendência de contas alcançadas ao longo do tempo
4. Melhor dia ou período de publicação identificado nos dados
5. Relação entre engajamento (curtidas + comentários + salvamentos) e alcance
6. Posts com dados parciais que merecem atenção especial
7. Comparação entre os 3 posts de maior e menor alcance — o que os diferencia
8. Recomendação prioritária para maximizar o alcance no próximo mês

Retorne APENAS um JSON válido com exatamente 8 objetos (sem markdown, sem texto fora do JSON):
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
  const text = data.content?.[0]?.text || ''
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
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

  const systemPrompt = `Você é um analista de redes sociais especializado em finanças e investimentos, assistente do time de Instagram da Itaú Asset Management.
Você tem acesso aos dados completos do dashboard de performance do Instagram @itauasset.

CONTEXTO:
- Mês/filtro atual: ${mesFiltro}
- Meta mensal: ${metaMensal?.toLocaleString('pt-BR')} contas alcançadas
- Meta anual: ${metaAnual?.toLocaleString('pt-BR')} contas alcançadas
- Total de posts na base: ${posts.length}

DADOS DOS POSTS:
${JSON.stringify(resumo, null, 2)}

Responda em português brasileiro, de forma clara e analítica. Cite posts e dados reais quando relevante. Use formatação brasileira para números.`

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
