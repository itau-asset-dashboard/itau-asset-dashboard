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

export async function extractLinkedinFromImage(base64, mediaType, apiKey) {
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
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Você é um assistente que extrai métricas de prints do LinkedIn Analytics.

O LinkedIn exibe as métricas em uma LINHA HORIZONTAL nesta ordem exata:
IMPRESSÕES | VISUALIZAÇÕES | CLIQUES | CTR | REAÇÕES

Exemplos reais de como aparecem:
- "3.392  2.253  513  15,12%  182" → impressoes=3392, visualizacoes=2253, cliques=513, ctr=15.12, reacoes=182
- "2.256  698  43  1,91%  —"     → impressoes=2256, visualizacoes=698, cliques=43, ctr=1.91, reacoes=null

REGRAS:
1. A PRIMEIRA coluna numérica (maior número) = impressoes.
2. A SEGUNDA coluna = visualizacoes (pode não existir em posts sem vídeo/artigo).
3. A coluna com "%" = ctr (retorne como decimal: 15,12% → 15.12).
4. A ÚLTIMA coluna inteira = reacoes.
5. Use pontos como separador de milhar (3.392 = 3392).
6. Se um número estiver em azul/destaque, não muda sua posição — a ordem permanece igual.
7. A data aparece geralmente como "24/06/2026" ou "jun 2026" — extraia no formato DD/MM/AAAA.

Retorne APENAS JSON válido (sem markdown):
{
  "data_post": "DD/MM/AAAA ou null",
  "impressoes": número inteiro ou null,
  "visualizacoes": número inteiro ou null,
  "cliques": número inteiro ou null,
  "ctr": número decimal ou null,
  "reacoes": número inteiro ou null
}
Não invente valores. Use null para campos não encontrados.`
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [{ type: 'text', cache_control: { type: 'ephemeral' }, text: `Você é uma analista de social media sênior para o mercado financeiro, avaliando a performance do Instagram @itauasset da Itaú Asset Management.

DADOS:
- Posts cadastrados: ${posts.length} | Stories: ${stories.length}
- Meta anual: ${fmt(metaAnual)} contas | Mês de referência: ${mesFiltro}

EVOLUÇÃO MENSAL DE POSTS:
${JSON.stringify(resumoMensal, null, 2)}

EVOLUÇÃO MENSAL DE STORIES:
${JSON.stringify(resumoStoriesMensal, null, 2)}

POSTS INDIVIDUAIS:
${JSON.stringify(posts.map(p => ({
  nome: p.nome, data: p.data_post, tipo: p.tipo,
  temas: Array.isArray(p.tema) ? p.tema.join(', ') : p.tema,
  alcance: p.contas_alcancadas, curtidas: p.curtidas,
  comentarios: p.comentarios, salvamentos: p.salvamentos,
  compartilhamentos: p.compartilhamentos,
})), null, 2)}

Gere EXATAMENTE 3 insights analíticos, cada um com ângulo diferente (formato, tema, tendência ou comparação feed vs stories).

REGRAS DE TOM — siga à risca:
- Tom calmo, analítico e construtivo — como um relatório executivo
- PROIBIDO usar linguagem dramática ou alarmista: não use "colapso", "queda livre", "alarmante", "preocupante", "crítico", "urgente", "grave", "fracasso", ou equivalentes
- Variações negativas são "oportunidade de melhoria", "resultado abaixo da média", "tendência de queda moderada" — nunca catástrofes
- Cite números reais e termine com recomendação concreta e neutra
- 2 a 3 frases por insight

Retorne APENAS JSON válido, sem markdown:
[
  { "icone": "📊", "titulo": "título direto", "texto": "análise com dados reais e recomendação" },
  { "icone": "📈", "titulo": "título direto", "texto": "análise com dados reais e recomendação" },
  { "icone": "💡", "titulo": "título direto", "texto": "análise com dados reais e recomendação" }
]

IMPORTANTE: títulos em sentence case — só a primeira palavra em maiúscula. Exemplo correto: "Carrossel lidera alcance em maio". Errado: "Carrossel Lidera Alcance Em Maio".` }]
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
  const pct = (v, t) => t > 0 ? `${Math.round(v / t * 100)}%` : '—'

  // ── Helpers de agrupamento ───────────────────────────────────────────────
  function mesKey(dateStr) {
    if (!dateStr) return null
    const p = dateStr.split('/')
    return p.length >= 3 ? `${p[1]}/${p[2]}` : null   // MM/YYYY
  }
  function sortMes(a, b) {
    const [am, ay] = a.split('/').map(Number)
    const [bm, by] = b.split('/').map(Number)
    return ay !== by ? ay - by : am - bm
  }

  // ── Filtros do mês em foco ───────────────────────────────────────────────
  const postsMes   = posts.filter(p => mesKey(p.data_post) === mesFiltro)
  const storiesMes = stories.filter(s => mesKey(s.data)    === mesFiltro)

  const engPost = p => (p.curtidas||0)+(p.comentarios||0)+(p.salvamentos||0)+(p.compartilhamentos||0)

  // ── Resumo mensal de POSTS (pré-calculado — evita erros de soma da IA) ──
  const postsPorMesMap = {}
  posts.forEach(p => {
    const k = mesKey(p.data_post)
    if (!k) return
    if (!postsPorMesMap[k]) postsPorMesMap[k] = []
    postsPorMesMap[k].push(p)
  })
  const postsMensalResumo = Object.entries(postsPorMesMap)
    .sort(([a], [b]) => sortMes(a, b))
    .map(([mes, ps]) => {
      const alcanceTotal = ps.reduce((s, p) => s + (p.contas_alcancadas||0), 0)
      const engTotal     = ps.reduce((s, p) => s + engPost(p), 0)
      const melhor       = ps.reduce((a, b) => (a.contas_alcancadas||0) > (b.contas_alcancadas||0) ? a : b)
      return {
        mes,
        posts: ps.length,
        alcance_total: alcanceTotal,
        alcance_medio: Math.round(alcanceTotal / ps.length),
        engajamento_total: engTotal,
        melhor_post: `${melhor.nome} (${fmt(melhor.contas_alcancadas)} contas)`,
        por_tipo: ['Carrossel','Reels','Foto estática'].map(t => {
          const tp = ps.filter(p => p.tipo === t)
          return tp.length ? { tipo: t, posts: tp.length, alcance: tp.reduce((s, p) => s + (p.contas_alcancadas||0), 0) } : null
        }).filter(Boolean),
      }
    })

  // ── Resumo mensal de STORIES (pré-calculado) ─────────────────────────────
  const storiesPorMesMap = {}
  stories.forEach(s => {
    const k = mesKey(s.data)
    if (!k) return
    if (!storiesPorMesMap[k]) storiesPorMesMap[k] = []
    storiesPorMesMap[k].push(s)
  })
  const storiesMensalResumo = Object.entries(storiesPorMesMap)
    .sort(([a], [b]) => sortMes(a, b))
    .map(([mes, ss]) => {
      const visTotal = ss.reduce((s, st) => s + (st.visualizacoes||0), 0)
      return {
        mes,
        quantidade: ss.length,
        visualizacoes_total: visTotal,
        interacoes_total: ss.reduce((s, st) => s + (st.interacoes||0), 0),
        atividade_perfil_total: ss.reduce((s, st) => s + (st.atividade_perfil||0), 0),
        media_visualizacoes: Math.round(visTotal / ss.length),
      }
    })

  // ── Totais anuais ────────────────────────────────────────────────────────
  const anoFoco    = mesFiltro?.split('/')?.[1] || '2026'
  const postsAno   = posts.filter(p => mesKey(p.data_post)?.endsWith(anoFoco))
  const storiesAno = stories.filter(s => mesKey(s.data)?.endsWith(anoFoco))
  const alcanceAno = postsAno.reduce((s, p) => s + (p.contas_alcancadas||0), 0)

  // ── Mês atual real (para distinguir mês em curso de meses completos) ──────
  const hoje        = new Date()
  const mesAtualKey = `${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`
  const diaHoje     = hoje.getDate()
  const diasNoMes   = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate()
  const pctMesDecorrido = Math.round(diaHoje / diasNoMes * 100)

  // Meses completos = meses do ano em foco excluindo o mês atual (ainda em curso)
  const mesesDoAno     = Object.keys(postsPorMesMap).filter(k => k.endsWith(anoFoco))
  const mesesCompletos = mesesDoAno.filter(k => k !== mesAtualKey)
  const mesAtualTemDados = mesesDoAno.includes(mesAtualKey)

  // ── Projeção: usa apenas meses completos para a média ────────────────────
  let projecaoAnual   = null
  let mediaMensal     = null
  let alcanceCompletos = 0
  if (mesesCompletos.length > 0) {
    alcanceCompletos = mesesCompletos.reduce((s, k) => {
      return s + (postsPorMesMap[k]?.reduce((a, p) => a + (p.contas_alcancadas||0), 0) || 0)
    }, 0)
    mediaMensal  = Math.round(alcanceCompletos / mesesCompletos.length)
    // Acumulado = alcance dos meses completos + estimativa proporcional do mês atual
    const alcanceMesAtualParcial = mesAtualTemDados
      ? (postsPorMesMap[mesAtualKey]?.reduce((s, p) => s + (p.contas_alcancadas||0), 0) || 0)
      : 0
    const estimativaMesAtual = pctMesDecorrido > 0
      ? Math.round(alcanceMesAtualParcial / pctMesDecorrido * 100)
      : mediaMensal
    const mesesRestantes = 12 - mesesCompletos.length - 1 // -1 pelo mês atual
    projecaoAnual = alcanceCompletos + estimativaMesAtual + (mediaMensal * Math.max(mesesRestantes, 0))
  }

  // ── Agregados do mês em foco ─────────────────────────────────────────────
  const alcanceMes      = postsMes.reduce((s, p) => s + (p.contas_alcancadas||0), 0)
  const melhorPost      = postsMes.length ? postsMes.reduce((a, b) => (a.contas_alcancadas||0) > (b.contas_alcancadas||0) ? a : b) : null
  const totalVisMes     = storiesMes.reduce((s, st) => s + (st.visualizacoes||0), 0)
  const totalInterMes   = storiesMes.reduce((s, st) => s + (st.interacoes||0), 0)
  const totalAtivMes    = storiesMes.reduce((s, st) => s + (st.atividade_perfil||0), 0)
  const melhorStory     = storiesMes.length ? storiesMes.reduce((a, b) => (a.visualizacoes||0) > (b.visualizacoes||0) ? a : b) : null

  const systemPrompt = `Você é uma especialista sênior em redes sociais para o mercado financeiro, responsável pela performance do Instagram @itauasset da Itaú Asset Management.

Você tem acesso a TODOS os dados do dashboard — posts, stories, metas e projeções. Responda com profundidade analítica, citando sempre números reais. Nunca diga que não tem acesso a dados — eles estão todos aqui abaixo.

═══════════════════════════════════════
VISÃO ANUAL ${anoFoco}
═══════════════════════════════════════
Alcance acumulado (${anoFoco}): ${fmt(alcanceAno)} contas
Meta anual: ${fmt(metaAnual)} contas | Progresso: ${pct(alcanceAno, metaAnual)} da meta anual
Posts publicados no ano: ${postsAno.length} | Stories no ano: ${storiesAno.length}

Mês atual: ${mesAtualKey} (${diaHoje}º dia de ${diasNoMes} — ${pctMesDecorrido}% do mês decorrido)
⚠️ ATENÇÃO: O mês atual (${mesAtualKey}) está em curso — os dados dele são PARCIAIS. Nunca use o alcance parcial de ${mesAtualKey} como se fosse o resultado final do mês.

Projeção metodologia:
- Média mensal (baseada em ${mesesCompletos.length} meses completos): ${mediaMensal ? fmt(mediaMensal) + ' contas/mês' : '—'}
- Estimativa ${mesAtualKey} ao final do mês (extrapolação proporcional): ${mesAtualTemDados && pctMesDecorrido > 0 ? fmt(Math.round((postsPorMesMap[mesAtualKey]?.reduce((s,p)=>s+(p.contas_alcancadas||0),0)||0) / pctMesDecorrido * 100)) + ' contas' : '—'}
- Projeção ao final de ${anoFoco}: ${projecaoAnual ? fmt(projecaoAnual) + ' contas' : '—'}
${projecaoAnual && metaAnual ? `- Cenário projetado: ${projecaoAnual >= metaAnual ? '✅ META ATINGIDA na projeção' : `⚠️ ${fmt(metaAnual - projecaoAnual)} abaixo da meta — mas ainda há meses para recuperar`}` : ''}

═══════════════════════════════════════
ALCANCE MENSAL DE POSTS — ${anoFoco} (PRÉ-CALCULADO, USE ESTES NÚMEROS)
═══════════════════════════════════════
${postsMensalResumo.length > 0 ? postsMensalResumo.map(m =>
  `${m.mes}: ${fmt(m.alcance_total)} contas | ${m.posts} posts | média ${fmt(m.alcance_medio)}/post | engaj. ${fmt(m.engajamento_total)} | melhor: ${m.melhor_post}`
).join('\n') : 'Nenhum post cadastrado.'}

═══════════════════════════════════════
ALCANCE MENSAL DE STORIES — ${anoFoco} (PRÉ-CALCULADO)
═══════════════════════════════════════
${storiesMensalResumo.length > 0 ? storiesMensalResumo.map(m =>
  `${m.mes}: ${fmt(m.visualizacoes_total)} visualiz. | ${m.quantidade} stories | média ${fmt(m.media_visualizacoes)}/story | interações ${fmt(m.interacoes_total)}`
).join('\n') : 'Nenhum story cadastrado.'}

═══════════════════════════════════════
MÊS EM FOCO: ${mesFiltro}
═══════════════════════════════════════
Posts: ${postsMes.length} publicações | Alcance: ${fmt(alcanceMes)} | Meta: ${fmt(metaMensal)} | ${pct(alcanceMes, metaMensal)} da meta mensal
Melhor post do mês: ${melhorPost ? `"${melhorPost.nome}" — ${fmt(melhorPost.contas_alcancadas)} contas` : 'N/A'}
Stories: ${storiesMes.length} | Visualiz.: ${fmt(totalVisMes)} | Interações: ${fmt(totalInterMes)} | Ativ. perfil: ${fmt(totalAtivMes)}
Melhor story do mês: ${melhorStory ? `"${melhorStory.nome}" — ${fmt(melhorStory.visualizacoes)} visualizações` : 'N/A'}

Detalhe posts do mês:
${postsMes.length > 0 ? JSON.stringify(postsMes.map(p => ({
  nome: p.nome, data: p.data_post, tipo: p.tipo,
  temas: Array.isArray(p.tema) ? p.tema.join(', ') : p.tema,
  alcance: p.contas_alcancadas, curtidas: p.curtidas,
  comentarios: p.comentarios, salvamentos: p.salvamentos,
  compartilhamentos: p.compartilhamentos, status: p.status,
})), null, 2) : 'Nenhum post neste período.'}

Detalhe stories do mês:
${storiesMes.length > 0 ? JSON.stringify(storiesMes.map(s => ({
  nome: s.nome, data: s.data,
  temas: Array.isArray(s.tema) ? s.tema.join(', ') : null,
  visualizacoes: s.visualizacoes, interacoes: s.interacoes, atividade_perfil: s.atividade_perfil,
})), null, 2) : 'Nenhum story neste período.'}

═══════════════════════════════════════
TODOS OS POSTS — HISTÓRICO COMPLETO (${posts.length} posts)
═══════════════════════════════════════
${JSON.stringify(posts.map(p => ({
  nome: p.nome, data: p.data_post, tipo: p.tipo,
  temas: Array.isArray(p.tema) ? p.tema.join(', ') : (p.tema || null),
  alcance: p.contas_alcancadas, visualizacoes: p.visualizacoes,
  curtidas: p.curtidas, comentarios: p.comentarios,
  salvamentos: p.salvamentos, compartilhamentos: p.compartilhamentos,
  engajamento_total: engPost(p), status: p.status,
})), null, 2)}

═══════════════════════════════════════
TODOS OS STORIES — HISTÓRICO COMPLETO (${stories.length} stories)
═══════════════════════════════════════
${stories.length > 0 ? JSON.stringify(stories.map(s => ({
  nome: s.nome, data: s.data,
  temas: Array.isArray(s.tema) ? s.tema.join(', ') : null,
  visualizacoes: s.visualizacoes, interacoes: s.interacoes, atividade_perfil: s.atividade_perfil,
})), null, 2) : 'Nenhum story cadastrado.'}

═══════════════════════════════════════
INSTRUÇÕES DE RESPOSTA
═══════════════════════════════════════
- NUNCA diga que não tem acesso a dados — todos os dados estão acima
- Para alcance por mês, use a seção "ALCANCE MENSAL DE POSTS" — os valores já estão somados
- Para projeções, use a projeção linear calculada acima como base e ajuste com contexto
- Escreva em parágrafos corridos — sem tabelas ou colunas (visualização mobile)
- Use **negrito** para destacar números-chave e conclusões
- Se precisar separar seções use ## Título — nunca tabelas
- Números no formato brasileiro: ponto para milhar, vírgula para decimal
- Tom: especialista em social media para mercado financeiro — analítica, direta, com recomendações concretas
- Respostas objetivas: vá direto ao ponto, sem introduções longas`

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
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
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
