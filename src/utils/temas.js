// Temas antigos que devem ser migrados para o novo nome
const TEMA_MIGRATION = {
  'ETFs em destaque':  'ETFs',
  'Educacionais ETFs': 'ETFs',
}

// Temas válidos atualmente
export const TEMAS_VALIDOS = [
  'Carreira','ETFs','Análises econômicas','Trends','Fundos',
  'Performance em destaque','ESG','Ring the bell','Dump','Live',
  'Dividendos','Premiações','Mind Asset','Eventos','Educacional','Um dia com',
]

/**
 * Normaliza o campo `tema` de um post. Lida com todos os formatos:
 *   - null / undefined           → []
 *   - string normal: "ETFs"      → ["ETFs"]
 *   - array normal: ["ETFs"]     → ["ETFs"]
 *   - JSON string: '["ETFs"]'    → ["ETFs"]
 *   - JS notation: "['ETFs']"    → ["ETFs"]
 *   - temas antigos              → migrado automaticamente
 */
export function getTemas(post) {
  let t = post?.tema
  if (!t) return []

  // Se for string, tenta fazer parse de array serializado
  if (typeof t === 'string') {
    const trimmed = t.trim()
    if (trimmed.startsWith('[')) {
      // Tenta JSON.parse; se falhar, normaliza aspas simples e tenta de novo
      let parsed = null
      for (const attempt of [trimmed, trimmed.replace(/'/g, '"')]) {
        try { parsed = JSON.parse(attempt); break } catch { /* continua */ }
      }
      if (Array.isArray(parsed)) {
        t = parsed
      } else if (parsed != null) {
        t = [String(parsed)]
      } else {
        // fallback: remove colchetes e divide por vírgula
        t = trimmed
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map(s => s.trim().replace(/^['"\s]+|['"\s]+$/g, ''))
      }
    } else {
      t = [trimmed]
    }
  }

  if (!Array.isArray(t)) t = [String(t)]

  // Aplica migração de temas antigos + remove inválidos + remove duplicatas + remove vazios
  const migrated = t
    .map(x => String(x).trim().replace(/^["']+|["']+$/g, '').trim())
    .filter(Boolean)
    .map(x => TEMA_MIGRATION[x] || x)
    .filter(x => TEMAS_VALIDOS.includes(x))

  return [...new Set(migrated)]
}

/** Verifica se um post pertence a um tema específico. */
export function hasTheme(post, tema) {
  return getTemas(post).includes(tema)
}

/** Verifica se um post pertence a pelo menos um dos temas da lista. */
export function hasAnyTheme(post, temaList) {
  const pt = getTemas(post)
  return temaList.some(t => pt.includes(t))
}

/** Label de exibição: join com " · " */
export function temasLabel(post) {
  return getTemas(post).join(' · ') || ''
}

/**
 * Limpa o campo tema de um post para o formato correto (array de strings válidas).
 * Usa para migração de dados persistidos.
 */
export function normalizeTema(raw) {
  return getTemas({ tema: raw })
}
