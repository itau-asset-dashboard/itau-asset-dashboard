/**
 * Normaliza o campo `tema` de um post, que pode ser:
 *   - string (posts antigos): "ETFs"
 *   - array  (posts novos):   ["ETFs", "Educacionais ETFs"]
 *   - null / undefined
 * Sempre retorna string[].
 */
export function getTemas(post) {
  const t = post?.tema
  if (!t) return []
  if (Array.isArray(t)) return t.filter(Boolean)
  return [t]
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
