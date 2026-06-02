/**
 * Meta mensal ajustada — para o card "Meta mensal atualizada" na Visão Anual.
 * Sempre usa o mês real de hoje como referência:
 * - Meses passados: congelados em metaAnual ÷ 12
 * - Mês atual e futuros: (metaAnual − total acumulado até ontem) ÷ meses restantes
 */
export function calcMetaMesAjustada({ posts, metaAnual, mesFiltroParam }) {
  if (!mesFiltroParam || !metaAnual) return Math.round((metaAnual || 0) / 12)

  const [mmStr, yyyy] = mesFiltroParam.split('/')
  const mesVisto = parseInt(mmStr, 10)

  const hoje    = new Date()
  const mesHoje = hoje.getMonth() + 1
  const anoHoje = String(hoje.getFullYear())

  // Meses passados → meta base fixa
  if (yyyy < anoHoje || (yyyy === anoHoje && mesVisto < mesHoje)) {
    return Math.round(metaAnual / 12)
  }

  // Mês atual ou futuro → distribui saldo pelos meses restantes
  const mesCorte = yyyy === anoHoje ? mesHoje : 1
  const totalFechado = posts.reduce((s, p) => {
    const pts = p.data_post?.split('/')
    if (!pts || pts[2] !== yyyy) return s
    const mes = parseInt(pts[1], 10)
    if (mes < mesCorte) return s + (p.contas_alcancadas || 0)
    return s
  }, 0)

  const mesesRestantes = 12 - mesCorte + 1
  if (mesesRestantes <= 0) return 0

  return Math.round(Math.max(metaAnual - totalFechado, 0) / mesesRestantes)
}

/**
 * Meta progressiva por mês — para as barras do gráfico anual e painel direito.
 *
 * Regra:
 * - Meses já encerrados (< mês real de hoje): meta calculada a partir daquele mês
 *     → (metaAnual − total dos meses anteriores) ÷ meses restantes a partir dali
 * - Mês atual e futuros (>= mês real de hoje): todos mostram a mesma meta
 *     → (metaAnual − total acumulado até o mês anterior ao atual) ÷ meses restantes
 *     O valor só muda quando o mês virar.
 */
export function calcMetaMesProgressiva({ posts, metaAnual, mm, yyyy }) {
  if (!metaAnual) return 0

  const mes     = parseInt(mm, 10)
  const hoje    = new Date()
  const mesHoje = hoje.getMonth() + 1
  const anoHoje = String(hoje.getFullYear())

  // Define o "corte": para meses passados usa o próprio mês, para atual/futuros usa hoje
  const isPast  = yyyy < anoHoje || (yyyy === anoHoje && mes < mesHoje)
  const mesCorte = isPast ? mes : mesHoje

  const totalAnteriores = posts.reduce((s, p) => {
    const pts = p.data_post?.split('/')
    if (!pts || pts[2] !== yyyy) return s
    if (parseInt(pts[1], 10) < mesCorte) return s + (p.contas_alcancadas || 0)
    return s
  }, 0)

  const mesesRestantes = 12 - mesCorte + 1
  if (mesesRestantes <= 0) return 0

  return Math.round(Math.max(metaAnual - totalAnteriores, 0) / mesesRestantes)
}
