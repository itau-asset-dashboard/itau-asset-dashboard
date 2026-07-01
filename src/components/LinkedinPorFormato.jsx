import { useState } from 'react'
import { useIsMobile } from '../utils/useIsMobile'

const FORMATOS = [
  { id: 'Imagem',    label: 'Imagem',              color: '#0A66C2' },
  { id: 'Vídeo',     label: 'Vídeo',               color: '#FF6200' },
  { id: 'Documento', label: 'Documento',            color: '#1C252E' },
  { id: 'Artigo',    label: 'Artigo / Newsletter',  color: '#16a34a' },
]

// Papel de cada métrica dependendo do formato
const ROLES = {
  impressoes:    () => 'Distribuição',
  visualizacoes: (id) => (id === 'Vídeo' || id === 'Artigo') ? 'Consumo' : 'Visualizações',
  cliques:       (id) => id === 'Documento' ? 'Consumo' : 'Ação',
  ctr:           () => 'Taxa',
  taxa_viz:      () => 'Consumo %',
  reacoes:       () => 'Engajamento',
}

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtN(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}
function fmtCtr(n)  { return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(2).replace('.',',') + '%' }
function fmtPct(n)  { return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(1).replace('.',',') + '%' }

// Determina quais colunas mostrar com base nos dados reais do formato
function buildColunas(formatoId, ps) {
  const hasViz = ps.some(p => (p.visualizacoes || 0) > 0)
  const hasClk = ps.some(p => (p.cliques || 0) > 0)
  const hasCtr = ps.some(p => p.ctr != null && p.ctr !== '' && p.ctr !== 0)
  const hasRea = ps.some(p => (p.reacoes || 0) > 0)

  const cols = [
    { key: 'impressoes', label: 'Impressões', tipo: 'total' },
  ]
  if (hasViz) cols.push({ key: 'visualizacoes', label: 'Visualizações', tipo: 'total' })
  if (hasViz && formatoId === 'Vídeo') cols.push({ key: 'taxa_viz', label: 'Taxa visual.', tipo: 'calc' })
  if (hasClk) cols.push({ key: 'cliques', label: 'Cliques', tipo: 'total' })
  if (hasCtr) cols.push({ key: 'ctr', label: 'CTR', tipo: 'media' })
  if (hasRea) cols.push({ key: 'reacoes', label: 'Reações', tipo: 'total' })

  return cols
}

function calcColValue(col, ps) {
  if (ps.length === 0) return null
  if (col.tipo === 'total') return ps.reduce((s, p) => s + (p[col.key] || 0), 0)
  if (col.tipo === 'media') {
    const valid = ps.filter(p => p[col.key] != null && p[col.key] !== '')
    return valid.length ? valid.reduce((s, p) => s + Number(p[col.key] || 0), 0) / valid.length : null
  }
  if (col.tipo === 'calc') {
    const imp = ps.reduce((s, p) => s + (p.impressoes    || 0), 0)
    const viz = ps.reduce((s, p) => s + (p.visualizacoes || 0), 0)
    return imp > 0 ? (viz / imp) * 100 : null
  }
  return null
}

function fmtCol(col, v) {
  if (v == null) return '—'
  if (col.key === 'ctr')      return fmtCtr(v)
  if (col.key === 'taxa_viz') return fmtPct(v)
  return fmtN(v)
}

export default function LinkedinPorFormato({ posts, ano }) {
  const mobile = useIsMobile()
  const [formatoSel, setFormatoSel] = useState('Imagem')

  const formato = FORMATOS.find(f => f.id === formatoSel)
  const ps = posts.filter(p => p.tipo === formatoSel)
  const colunas = buildColunas(formatoSel, ps)

  // Totais do ano
  const anoTotais = {}
  colunas.forEach(col => { anoTotais[col.key] = calcColValue(col, ps) })

  // Dados mensais
  const mesesData = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const mps = ps.filter(p => p.data_post?.split('/')?.[1] === mm)
    const row = { mes: MESES_LABEL[i], mesFull: MESES_FULL[i], count: mps.length }
    colunas.forEach(col => { row[col.key] = calcColValue(col, mps) })
    return row
  })

  const formatsComPosts = new Set(posts.map(p => p.tipo).filter(Boolean))

  if (posts.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post LinkedIn em {ano}.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Seletor de formato */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FORMATOS.map(f => {
          const count = posts.filter(p => p.tipo === f.id).length
          const ativo = formatoSel === f.id
          const temPosts = formatsComPosts.has(f.id)
          return (
            <button key={f.id} onClick={() => setFormatoSel(f.id)} style={{
              padding: mobile ? '6px 14px' : '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: mobile ? 12 : 13, fontWeight: ativo ? 700 : 400,
              background: ativo ? f.color : '#F5F7FA',
              color: ativo ? '#fff' : temPosts ? '#4A5568' : '#C0CEDA',
              transition: 'all 0.15s',
            }}>
              {f.label}
              {temPosts && !ativo && <span style={{ marginLeft: 5, fontSize: 10, color: '#9AAAB8' }}>({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Sem posts neste formato */}
      {ps.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderLeft: `4px solid ${formato.color}30` }}>
          <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum post do tipo <strong>{formato.label}</strong> em {ano}.</p>
        </div>
      ) : (
        <>
          {/* Legenda de papéis */}
          <div className="card" style={{ padding: '12px 18px', borderLeft: `4px solid ${formato.color}` }}>
            <p style={{ color: '#6B7A8D', fontSize: 12, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: formato.color }}>{formato.label}</span>
              {' '}— métricas preenchidas neste formato:
            </p>
            <div style={{ display: 'flex', gap: mobile ? 10 : 20, flexWrap: 'wrap' }}>
              {colunas.map(col => (
                <div key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ background: `${formato.color}20`, color: formato.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {ROLES[col.key]?.(formatoSel) || col.label}
                  </span>
                  <span style={{ color: '#4A5568', fontSize: 12 }}>{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs do ano */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : `repeat(${Math.min(colunas.length + 1, 5)},1fr)`, gap: mobile ? 8 : 12 }}>
            <div className="card" style={{ padding: mobile ? '12px 14px' : '14px 18px' }}>
              <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Posts</p>
              <p style={{ color: '#1C252E', fontSize: mobile ? 20 : 24, fontWeight: 800, lineHeight: 1 }}>{ps.length}</p>
              <p style={{ color: '#A8B5C0', fontSize: 10, marginTop: 3 }}>em {ano}</p>
            </div>
            {colunas.map(col => (
              <div key={col.key} className="card" style={{ padding: mobile ? '12px 14px' : '14px 18px' }}>
                <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  {col.label}
                  <span style={{ fontWeight: 400, color: `${formato.color}80`, marginLeft: 4 }}>· {ROLES[col.key]?.(formatoSel)}</span>
                </p>
                <p style={{ color: formato.color, fontSize: mobile ? 20 : 24, fontWeight: 800, lineHeight: 1 }}>
                  {fmtCol(col, anoTotais[col.key])}
                </p>
              </div>
            ))}
          </div>

          {/* Tabela mensal */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #F0F4F8' }}>
              <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>
                Evolução mensal — <span style={{ color: formato.color }}>{formato.label}</span>
              </p>
              <p style={{ color: '#9AAAB8', fontSize: 12, marginTop: 2 }}>Métricas exibidas com base nos dados preenchidos</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ background: '#FAFBFC' }}>
                    <th style={{ padding: '9px 16px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Mês</th>
                    <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>Posts</th>
                    {colunas.map(col => (
                      <th key={col.key} style={{ padding: '9px 14px', textAlign: 'right' }}>
                        <p style={{ color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.label}</p>
                        <p style={{ color: `${formato.color}70`, fontSize: 9, fontWeight: 500, marginTop: 1 }}>{ROLES[col.key]?.(formatoSel)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mesesData.map((m, i) => {
                    const vazio = m.count === 0
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #F5F7FA', opacity: vazio ? 0.35 : 1 }}>
                        <td style={{ padding: '10px 16px', color: vazio ? '#C0CEDA' : '#1C252E', fontSize: 13, fontWeight: vazio ? 400 : 600, whiteSpace: 'nowrap' }}>
                          {m.mesFull}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {vazio
                            ? <span style={{ color: '#D8E0E8', fontSize: 12 }}>—</span>
                            : <span style={{ background: `${formato.color}15`, color: formato.color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{m.count}</span>
                          }
                        </td>
                        {colunas.map(col => (
                          <td key={col.key} style={{
                            padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap',
                            color: vazio ? '#D8E0E8' : col.key === 'impressoes' ? formato.color : '#1C252E',
                            fontSize: 13, fontWeight: col.key === 'impressoes' ? 700 : 400,
                          }}>
                            {vazio ? '—' : fmtCol(col, m[col.key])}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  {/* Linha de totais */}
                  <tr style={{ borderTop: `2px solid ${formato.color}30`, background: `${formato.color}06` }}>
                    <td style={{ padding: '10px 16px', color: formato.color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total {ano}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: formato.color, fontSize: 13, fontWeight: 700 }}>{ps.length}</td>
                    {colunas.map(col => (
                      <td key={col.key} style={{ padding: '10px 14px', textAlign: 'right', color: formato.color, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {fmtCol(col, anoTotais[col.key])}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
