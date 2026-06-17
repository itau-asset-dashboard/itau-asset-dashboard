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

export async function extractStoryFromImage(base64, mediaType, apiKey) {
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
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Você é um assistente que extrai métricas de prints de stories do Instagram.

A tela de insights de um story mostra métricas como:
- Visualizações (ou "Views") — quantas vezes o story foi visto
- Interações — toques em links, figurinhas, enquetes, etc.
- Atividade do perfil — visitas ao perfil a partir do story
- Contas alcançadas — contas únicas que viram o story
- Respostas — mensagens diretas enviadas em resposta ao story
- Toques para avançar — quantas vezes avançaram para o próximo story
- Toques para retroceder — quantas vezes voltaram para ver de novo
- Saídas — quantas vezes saíram do story

Retorne APENAS um JSON válido (sem markdown, sem texto fora do JSON):
{
  "data": "DD/MM/AAAA ou null",
  "visualizacoes": número inteiro ou null,
  "interacoes": número inteiro ou null,
  "atividade_perfil": número inteiro ou null
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

export async function generateInsights(posts, apiKey, stories = [], metaAnual = 0, mesFiltro = '') {
  const fmt = n => n != null ? Number(n).toLocaleString('pt-BR') : '—'

  // Breakdown mensal de posts
  const postsPorMes = {}
  posts.forEach(p => {
    const parts = p.data_post?.split('/')
    if (!parts || parts.length < 3) return
    const key = `${parts[1]}/${parts[2]}`
    if (!postsPorMes[key]) postsPorMes[key] = []
    postsPorMes[key].push(p)
  })
  const resumoMensal = Object.entries(postsPorMes)
    .sort(([a], [b]) => {
      const [am, ay] = a.split('/').map(Number)
      const [bm, by] = b.split('/').map(Number)
      return ay !== by ? ay - by : am - bm
    })
    .map(([mes, ps]) => ({
      mes,
      posts: ps.length,
      alcance_total: ps.reduce((s, p) => s + (p.contas_alcancadas || 0), 0),
      alcance_medio: Math.round(ps.reduce((s, p) => s + (p.contas_alcancadas || 0), 0) / ps.length),
      por_tipo: ['Carrossel','Reels','Foto estática'].map(t => {
        const tp = ps.filter(p => p.tipo === t)
        return { tipo: t, posts: tp.length, alcance: tp.reduce((s, p) => s + (p.contas_alcancadas || 0), 0) }
      }).filter(t => t.posts > 0),
    }))

  // Breakdown mensal de stories
  const storiesPorMes = {}
  stories.forEach(s => {
    const parts = s.data?.split('/')
    if (!parts || parts.length < 3) return
    const key = `${parts[1]}/${parts[2]}`
    if (!storiesPorMes[key]) storiesPorMes[key] = []
    storiesPorMes[key].push(s)
  })
  const resumoStoriesMensal = Object.entries(storiesPorMes)
    .sort(([a],[b]) => {
      const [am,ay]=a.split('/').map(Number), [bm,by]=b.split('/').map(Number)
      return ay!==by?ay-by:am-bm
    })
    .map(([mes, ss]) => ({
      mes, quantidade: ss.length,
      visualizacoes_total: ss.reduce((s,st)=>s+(st.visualizacoes||0),0),
      interacoes_total: ss.reduce((s,st)=>s+(st.interacoes||0),0),
      media_visualizacoes: Math.round(ss.reduce((s,st)=>s+(st.visualizacoes||0),0)/ss.length),
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
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é uma especialista sênior em redes sociais para o mercado financeiro, responsável pela performance do Instagram @itauasset da Itaú Asset Management.

Analise os dados abaixo e gere EXATAMENTE 3 insights estratégicos em português brasileiro, cada um com um ângulo diferente.

DADOS COMPLETOS:
- Total de posts cadastrados: ${posts.length}
- Total de stories cadastrados: ${stories.length}
- Meta anual: ${fmt(metaAnual)} contas alcançadas
- Mês em foco: ${mesFiltro}

EVOLUÇÃO MENSAL DE POSTS:
${JSON.stringify(resumoMensal, null, 2)}

EVOLUÇÃO MENSAL DE STORIES:
${JSON.stringify(resumoStoriesMensal, null, 2)}

TODOS OS POSTS (dados individuais):
${JSON.stringify(posts.map(p => ({
  nome: p.nome, data: p.data_post, tipo: p.tipo,
  temas: Array.isArray(p.tema) ? p.tema.join(', ') : p.tema,
  alcance: p.contas_alcancadas, curtidas: p.curtidas,
  comentarios: p.comentarios, salvamentos: p.salvamentos,
  compartilhamentos: p.compartilhamentos,
})), null, 2)}

Cubra obrigatoriamente ângulos distintos entre:
- Qual formato de post (Carrossel, Reels, Foto estática) traz mais resultado e por quê
- Quais temas geram mais alcance ou engajamento
- Tendência de crescimento ou queda ao longo dos meses
- Comparação feed vs stories
- Recomendação estratégica concreta para o próximo período

Para cada insight: título direto + texto de 2 a 3 frases com dados reais e conclusão acionável.

Retorne APENAS um JSON válido com exatamente 3 objetos:
[
  { "icone": "📈", "titulo": "título curto", "texto": "insight com dados reais e recomendação" },
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

export async function chatWithData(messages, posts, stories, metaMensal, metaAnual, mesFiltro, apiKey) {
  const fmt = (n) => n != null ? Number(n).toLocaleString('pt-BR') : '—'

  // ── Separar por período ──────────────────────────────────────────────────
  const postsMes = posts.filter(p => {
    const parts = p.data_post?.split('/')
    return parts?.length >= 3 && `${parts[1]}/${parts[2]}` === mesFiltro
  })
  const storiesMes = stories.filter(s => {
    if (!s.data) return false
    const [, mm, yyyy] = s.data.split('/')
    return `${mm}/${yyyy}` === mesFiltro
  })

  // ── Agregados do mês — Posts ─────────────────────────────────────────────
  const alcanceMes   = postsMes.reduce((s, p) => s + (p.contas_alcancadas || 0), 0)
  const melhorPost   = postsMes.length ? postsMes.reduce((a, b) => (a.contas_alcancadas||0) > (b.contas_alcancadas||0) ? a : b) : null
  const engPost      = p => (p.curtidas||0)+(p.comentarios||0)+(p.salvamentos||0)+(p.compartilhamentos||0)

  // ── Agregados do mês — Stories ───────────────────────────────────────────
  const totalVisStories   = storiesMes.reduce((s, st) => s + (st.visualizacoes||0), 0)
  const totalInterStories = storiesMes.reduce((s, st) => s + (st.interacoes||0), 0)
  const totalAtivStories  = storiesMes.reduce((s, st) => s + (st.atividade_perfil||0), 0)
  const mediaVisStory     = storiesMes.length ? Math.round(totalVisStories / storiesMes.length) : 0
  const melhorStory       = storiesMes.length ? storiesMes.reduce((a, b) => (a.visualizacoes||0) > (b.visualizacoes||0) ? a : b) : null

  // ── Histórico completo — Posts ───────────────────────────────────────────
  const todosPostsResumo = posts.map(p => ({
    nome: p.nome,
    data: p.data_post,
    tipo: p.tipo,
    temas: Array.isArray(p.tema) ? p.tema.join(', ') : (p.tema || null),
    alcance: p.contas_alcancadas,
    visualizacoes: p.visualizacoes,
    curtidas: p.curtidas,
    comentarios: p.comentarios,
    salvamentos: p.salvamentos,
    compartilhamentos: p.compartilhamentos,
    engajamento_total: engPost(p),
    status: p.status,
  }))

  // ── Histórico completo — Stories ─────────────────────────────────────────
  const todosStoriesResumo = stories.map(s => ({
    nome: s.nome,
    data: s.data,
    temas: Array.isArray(s.tema) ? s.tema.join(', ') : null,
    visualizacoes: s.visualizacoes,
    interacoes: s.interacoes,
    atividade_perfil: s.atividade_perfil,
  }))

  // ── Resumo mensal de stories (pré-calculado para a IA não precisar contar) ─
  const storiesPorMes = {}
  stories.forEach(s => {
    if (!s.data) return
    const parts = s.data.split('/')
    if (parts.length < 3) return
    const key = `${parts[1]}/${parts[2]}`
    if (!storiesPorMes[key]) storiesPorMes[key] = []
    storiesPorMes[key].push(s)
  })
  const storiesResumoMensal = Object.entries(storiesPorMes)
    .sort(([a], [b]) => {
      const [am, ay] = a.split('/').map(Number)
      const [bm, by] = b.split('/').map(Number)
      return ay !== by ? ay - by : am - bm
    })
    .map(([mes, items]) => ({
      mes,
      quantidade: items.length,
      visualizacoes_total: items.reduce((s, st) => s + (st.visualizacoes || 0), 0),
      interacoes_total: items.reduce((s, st) => s + (st.interacoes || 0), 0),
      atividade_perfil_total: items.reduce((s, st) => s + (st.atividade_perfil || 0), 0),
      media_visualizacoes: Math.round(items.reduce((s, st) => s + (st.visualizacoes || 0), 0) / items.length),
    }))

  const systemPrompt = `Você é uma especialista sênior em redes sociais para o mercado financeiro, responsável pela performance do Instagram @itauasset da Itaú Asset Management. Responde com profundidade analítica, citando números reais e identificando padrões.

═══════════════════════════════════════
PANORAMA GERAL
═══════════════════════════════════════
Período em foco: ${mesFiltro}
Meta mensal (${mesFiltro}): ${fmt(metaMensal)} contas alcançadas
Meta anual: ${fmt(metaAnual)} contas alcançadas
Histórico total: ${posts.length} posts · ${stories.length} stories

═══════════════════════════════════════
MÊS ${mesFiltro} — POSTS (${postsMes.length} publicações)
═══════════════════════════════════════
Alcance total: ${fmt(alcanceMes)} contas | Meta: ${fmt(metaMensal)} | Progresso: ${metaMensal ? Math.round(alcanceMes/metaMensal*100) : '—'}%
Melhor post: ${melhorPost ? `"${melhorPost.nome}" — ${fmt(melhorPost.contas_alcancadas)} contas alcançadas` : 'N/A'}

Detalhe dos posts do mês:
${postsMes.length > 0 ? JSON.stringify(postsMes.map(p => ({
  nome: p.nome, data: p.data_post, tipo: p.tipo,
  temas: Array.isArray(p.tema) ? p.tema.join(', ') : p.tema,
  alcance: p.contas_alcancadas, visualizacoes: p.visualizacoes,
  curtidas: p.curtidas, comentarios: p.comentarios,
  salvamentos: p.salvamentos, compartilhamentos: p.compartilhamentos,
  status: p.status,
})), null, 2) : 'Nenhum post neste período.'}

═══════════════════════════════════════
MÊS ${mesFiltro} — STORIES (${storiesMes.length} stories)
═══════════════════════════════════════
Visualizações totais: ${fmt(totalVisStories)} | Interações: ${fmt(totalInterStories)} | Atividade perfil: ${fmt(totalAtivStories)}
Média de visualizações/story: ${fmt(mediaVisStory)}
Story com mais visualizações: ${melhorStory ? `"${melhorStory.nome}" — ${fmt(melhorStory.visualizacoes)} visualizações` : 'N/A'}

Detalhe dos stories do mês:
${storiesMes.length > 0 ? JSON.stringify(storiesMes.map(s => ({
  nome: s.nome, data: s.data,
  temas: Array.isArray(s.tema) ? s.tema.join(', ') : null,
  visualizacoes: s.visualizacoes, interacoes: s.interacoes, atividade_perfil: s.atividade_perfil,
})), null, 2) : 'Nenhum story registrado neste período.'}

═══════════════════════════════════════
RESUMO DE STORIES POR MÊS (use isto para contar/comparar meses)
═══════════════════════════════════════
${storiesResumoMensal.length > 0 ? JSON.stringify(storiesResumoMensal, null, 2) : 'Nenhum story com data registrada.'}

═══════════════════════════════════════
HISTÓRICO COMPLETO — TODOS OS POSTS (${posts.length})
═══════════════════════════════════════
${JSON.stringify(todosPostsResumo, null, 2)}

═══════════════════════════════════════
HISTÓRICO COMPLETO — TODOS OS STORIES (${stories.length})
═══════════════════════════════════════
${todosStoriesResumo.length > 0 ? JSON.stringify(todosStoriesResumo, null, 2) : 'Nenhum story cadastrado ainda.'}

═══════════════════════════════════════
DIRETRIZES DE RESPOSTA
═══════════════════════════════════════
- Escreva em parágrafos corridos, não em listas ou tabelas — a visualização mobile não comporta colunas
- Use **negrito** para destacar números, nomes de posts/stories e conclusões importantes
- Se precisar separar seções, use ## Título seguido de parágrafo — nunca colunas ou tabelas
- Cite sempre números reais do contexto acima — nunca invente ou estime dados
- Para comparações de meses ou contagem de stories, use o "RESUMO DE STORIES POR MÊS" — é pré-calculado e exato
- Para detalhes de post ou story específico, busque no histórico completo
- Números no formato brasileiro: ponto para milhar (ex: 27.400), vírgula para decimal
- Tom: especialista em social media para mercado financeiro — analítica, direta, com recomendações concretas
- Respostas objetivas: sem introduções longas, vá direto ao ponto`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
