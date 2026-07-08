import { useState, useRef, useCallback } from 'react'
import { X, Upload, Check, AlertCircle, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'

const TIPOS = ['Imagem', 'Vídeo', 'Artigo', 'Documento']

const TIPO_COLOR = {
  Imagem:    { bg: 'rgba(10,102,194,0.1)',  color: '#0A66C2' },
  Vídeo:     { bg: 'rgba(255,98,0,0.1)',    color: '#FF6200' },
  Documento: { bg: 'rgba(28,37,46,0.1)',    color: '#1C252E' },
  Artigo:    { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' },
}

function fmtN(n) {
  if (n == null || n === '') return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Math.round(n).toLocaleString('pt-BR')
}

function parseLinkedinXLS(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets['Todas as publicações']
  if (!ws) throw new Error('Aba "Todas as publicações" não encontrada.')

  // Row 2 (index 1) = cabeçalho real; dados a partir da linha 3 (index 2)
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  const header = rows[1]
  const dataRows = rows.slice(2).filter(r => r.some(c => c != null))

  const idx = (name) => header.findIndex(h => h && String(h).trim() === name)

  const iNome  = idx('Título da publicação')
  const iTipo  = idx('Tipo de conteúdo')
  const iData  = idx('Criação')
  const iImp   = idx('Impressões')
  const iVis   = idx('Visualizações')
  const iCli   = idx('Cliques')
  const iCtr   = idx('Taxa de cliques (CTR)')
  const iGost  = idx('Gostaram')
  const iLink  = idx('Link da publicação')

  return dataRows.map((row, i) => {
    const tituloFull = row[iNome] ? String(row[iNome]).trim() : ''
    const nome = tituloFull.split('\n')[0].slice(0, 100).trim()

    // Data: pode vir como Date object ou string DD/MM/YYYY
    let data_post = ''
    const rawData = row[iData]
    if (rawData instanceof Date) {
      const d = String(rawData.getDate()).padStart(2,'0')
      const m = String(rawData.getMonth()+1).padStart(2,'0')
      const y = rawData.getFullYear()
      data_post = `${d}/${m}/${y}`
    } else if (rawData) {
      data_post = String(rawData).trim()
    }

    // Tipo: LinkedIn exporta 'Vídeo' ou 'Artigo'; NaN = Imagem ou Documento
    const tipoRaw = row[iTipo] ? String(row[iTipo]).trim() : null
    const tipo = tipoRaw || null  // null = precisa de seleção manual

    // CTR: decimal no export (0.19 = 19%) → multiplicar por 100
    const ctrRaw = row[iCtr]
    const ctr = ctrRaw != null && !isNaN(Number(ctrRaw))
      ? Number((Number(ctrRaw) * 100).toFixed(2))
      : null

    return {
      _id: `import_${i}_${Date.now()}`,
      nome,
      tipo,
      data_post,
      impressoes:    row[iImp]  != null ? Number(row[iImp])  : null,
      visualizacoes: row[iVis]  != null ? Number(row[iVis])  : null,
      cliques:       row[iCli]  != null ? Number(row[iCli])  : null,
      ctr,
      reacoes:       row[iGost] != null ? Number(row[iGost]) : null,
      tema:          [],
      status:        'final',
      link:          row[iLink] ? String(row[iLink]).trim() : '',
    }
  })
}

export default function LinkedinImportModal({ onClose, onImport }) {
  const [posts, setPosts]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const [page, setPage]         = useState(0)
  const fileRef = useRef()
  const PAGE = 20

  const semTipo = posts ? posts.filter(p => !p.tipo).length : 0
  const podeSalvar = posts && posts.every(p => p.tipo)

  function handleFile(file) {
    setError(null)
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xls','xlsx'].includes(ext)) {
      setError('Arquivo inválido. Envie o .xls ou .xlsx exportado do LinkedIn.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseLinkedinXLS(new Uint8Array(e.target.result))
        if (!parsed.length) throw new Error('Nenhum post encontrado no arquivo.')
        setPosts(parsed)
        setPage(0)
      } catch (err) {
        setError(`Erro ao ler o arquivo: ${err.message}`)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  function setTipo(id, tipo) {
    setPosts(prev => prev.map(p => p._id === id ? { ...p, tipo } : p))
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Remove _id e link antes de salvar
      const toSave = posts.map(({ _id, link, ...rest }) => rest)
      await onImport(toSave)
      setDone(true)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(`Erro ao salvar: ${err.message}`)
      setSaving(false)
    }
  }

  const visible = posts ? posts.slice(page * PAGE, (page+1) * PAGE) : []
  const pages = posts ? Math.ceil(posts.length / PAGE) : 0

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,37,46,0.65)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth: posts ? 780 : 480,
        maxHeight:'92vh', overflow:'auto', boxShadow:'0 16px 56px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px', borderBottom:'1px solid #F0F4F8', flexShrink:0 }}>
          <div>
            <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700, margin:0 }}>Importar do LinkedIn</h2>
            {posts && (
              <p style={{ color:'#8A9BB0', fontSize:12, marginTop:2 }}>
                {posts.length} posts detectados
                {semTipo > 0 && <span style={{ color:'#FF6200', fontWeight:600 }}> · {semTipo} precisam de tipo</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:8, padding:7, cursor:'pointer', display:'flex' }}>
            <X size={16} color="#8A9BB0"/>
          </button>
        </div>

        <div style={{ padding:20, flex:1, overflow:'auto' }}>

          {/* Zona de upload */}
          {!posts && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#0A66C2' : '#D0D8E4'}`,
                borderRadius:16, padding:'48px 24px', textAlign:'center',
                background: dragging ? 'rgba(10,102,194,0.04)' : '#FAFBFC',
                cursor:'pointer', transition:'all 0.15s',
              }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'#F0F4F8',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Upload size={22} color="#8A9BB0"/>
              </div>
              <p style={{ color:'#1C252E', fontSize:14, fontWeight:600, marginBottom:6 }}>
                Arraste o arquivo do LinkedIn aqui
              </p>
              <p style={{ color:'#9AAAB8', fontSize:12, marginBottom:4 }}>
                ou clique para selecionar
              </p>
              <p style={{ color:'#C0CEDA', fontSize:11 }}>
                Exporte em <strong>Análise → Conteúdo → Exportar</strong> no LinkedIn
              </p>
              <input ref={fileRef} type="file" accept=".xls,.xlsx" style={{ display:'none' }}
                onChange={e => handleFile(e.target.files[0])}/>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'rgba(239,68,68,0.06)',
              border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', marginTop:12 }}>
              <AlertCircle size={14} color="#ef4444" style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ color:'#ef4444', fontSize:12 }}>{error}</p>
            </div>
          )}

          {/* Aviso tipo faltando */}
          {posts && semTipo > 0 && (
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'rgba(255,98,0,0.05)',
              border:'1px solid rgba(255,98,0,0.18)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
              <AlertCircle size={14} color="#FF6200" style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ color:'#FF6200', fontSize:12 }}>
                <strong>{semTipo} posts</strong> não têm tipo de conteúdo no export do LinkedIn (geralmente Imagem ou Documento).
                Selecione o tipo de cada um antes de importar.
              </p>
            </div>
          )}

          {/* Tabela de preview */}
          {posts && (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#FAFBFC' }}>
                    <th style={TH}>Data</th>
                    <th style={TH}>Post</th>
                    <th style={{ ...TH, minWidth:130 }}>Tipo</th>
                    <th style={TH}>Impressões</th>
                    <th style={TH}>Visual.</th>
                    <th style={TH}>Cliques</th>
                    <th style={TH}>Reações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => {
                    const tc = p.tipo ? TIPO_COLOR[p.tipo] : null
                    return (
                      <tr key={p._id} style={{ borderTop:'1px solid #F5F7FA' }}>
                        <td style={TD}><span style={{ color:'#9AAAB8', whiteSpace:'nowrap' }}>{p.data_post}</span></td>
                        <td style={{ ...TD, maxWidth:220 }}>
                          <p style={{ color:'#1C252E', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nome || '—'}</p>
                        </td>
                        <td style={TD}>
                          {p.tipo ? (
                            <span style={{ background: tc?.bg, color: tc?.color, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{p.tipo}</span>
                          ) : (
                            <TipoSelect value="" onChange={v => setTipo(p._id, v)}/>
                          )}
                        </td>
                        <td style={TD}><span style={{ color:'#0A66C2', fontWeight:700 }}>{fmtN(p.impressoes)}</span></td>
                        <td style={TD}><span style={{ color:'#1C252E' }}>{fmtN(p.visualizacoes)}</span></td>
                        <td style={TD}><span style={{ color:'#1C252E' }}>{fmtN(p.cliques)}</span></td>
                        <td style={TD}><span style={{ color:'#1C252E' }}>{fmtN(p.reacoes)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {pages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
              <p style={{ color:'#9AAAB8', fontSize:12 }}>
                {page*PAGE+1}–{Math.min((page+1)*PAGE, posts.length)} de {posts.length}
              </p>
              <div style={{ display:'flex', gap:6 }}>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)} style={{
                    padding:'3px 9px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11,
                    background: i === page ? '#1C252E' : '#F0F4F8',
                    color: i === page ? '#C3EBF7' : '#6B7A8D',
                  }}>{i+1}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {posts && (
          <div style={{ padding:'14px 20px', borderTop:'1px solid #F0F4F8', flexShrink:0 }}>
            {done ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)',
                borderRadius:12, padding:14 }}>
                <Check size={16} color="#16a34a"/>
                <span style={{ color:'#16a34a', fontWeight:700, fontSize:14 }}>
                  {posts.length} posts importados com sucesso!
                </span>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:12,
                  padding:'12px 18px', fontSize:13, cursor:'pointer', color:'#4A5568', fontWeight:500 }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!podeSalvar || saving}
                  style={{ flex:1, background: podeSalvar ? '#0A66C2' : '#D0D8E4',
                    color: podeSalvar ? '#fff' : '#9AAAB8',
                    border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700,
                    cursor: podeSalvar && !saving ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
                  {saving ? 'Importando...' : !podeSalvar
                    ? `Defina o tipo dos ${semTipo} posts restantes`
                    : `Importar ${posts.length} posts`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TipoSelect({ value, onChange }) {
  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          appearance:'none', background:'rgba(255,98,0,0.07)',
          border:'1.5px solid rgba(255,98,0,0.3)', borderRadius:8,
          padding:'3px 24px 3px 8px', fontSize:11, fontWeight:600,
          color:'#FF6200', cursor:'pointer', outline:'none',
          fontFamily:'DM Sans, sans-serif',
        }}>
        <option value="">Selecionar tipo</option>
        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <ChevronDown size={11} color="#FF6200" style={{ position:'absolute', right:6, pointerEvents:'none' }}/>
    </div>
  )
}

const TH = {
  padding:'9px 12px', color:'#8A9BB0', fontSize:10, fontWeight:600,
  textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left',
  whiteSpace:'nowrap',
}
const TD = { padding:'10px 12px', verticalAlign:'middle' }
