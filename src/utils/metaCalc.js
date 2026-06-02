/**
 * Calcula a meta mensal ajustada para um dado mês/filtro.
 * - Meses já encerrados (antes do mês real de hoje): retorna metaAnual ÷ 12 (congelada)
 * - Mês atual e futuros: distribui o saldo restante pelos meses restantes
 *
 * Recebe os valores diretamente (sem usar get()), garantindo reatividade
 * quando chamado dentro de um componente que já assina posts/metaAnual.
 */
export function calcMetaMesAjustada({ posts, metaAnual, mesFiltroParam }) {
  if (!mesFiltroParam || !metaAnual) return Math.round((metaAnual || 0) / 12)

  const [mmStr, yyyy] = mesFiltroParam.split('/')
  const mesVisto = parseInt(mmStr, 10)

  const hoje    = new Date()
  const mesHoje = hoje.getMonth() + 1
  const anoHoje = String(hoje.getFullYear())

  // Meses passados → meta base fixa (não recalcula)
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
