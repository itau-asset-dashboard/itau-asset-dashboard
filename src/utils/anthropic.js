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
Leia a imagem e retorne APENAS um JSON válido (sem markdown, sem explicação, sem bloco de código):
{
  "data_post": "DD/MM/AAAA ou texto visível na tela, ou null se não encontrar",
  "tipo": "Carrossel | Reels | Foto estática — inferir pelo visual (vídeo vertical = Reels, múltiplos slides = Carrossel, imagem única = Foto estática)",
  "contas_alcancadas": número inteiro ou null,
  "visualizacoes": número inteiro ou null,
  "interacoes": número inteiro (total de interações) ou null,
  "curtidas": número inteiro ou null,
  "comentarios": número inteiro ou null,
  "salvamentos": número inteiro ou null,
  "compartilhamentos": número inteiro ou null
}
Importante: extraia apenas números que estejam explicitamente visíveis no print. Não some nem calcule — use null se não encontrar o campo.`
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
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Você é um analista de redes sociais especializado em finanças e investimentos.
Analise os dados de posts do Instagram abaixo e gere de 3 a 5 insights estratégicos em português brasileiro.

Dados dos posts:
${JSON.stringify(resumo, null, 2)}

Foque em:
1. Qual tipo de post (Carrossel, Reels, Foto estática) performa melhor em contas alcançadas
2. Qual tema tem maior alcance médio
3. Tendência de contas alcançadas ao longo do tempo
4. Posts com dados parciais que merecem atenção especial
5. Recomendações para maximizar o alcance

Retorne APENAS um JSON válido (sem markdown):
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
