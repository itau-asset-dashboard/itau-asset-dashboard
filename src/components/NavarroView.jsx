import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, ExternalLink, Link2, BarChart2 } from 'lucide-react'
import { useIsMobile } from '../utils/useIsMobile'

function fmtN(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.',',') + 'K'
  return Number(n).toLocaleString('pt-BR')
}

const EMPTY_LINK = { id: '', nome: '', url: '', acessos: '' }

export default function NavarroView({ links = [], isEditMode, onSaveLink, onDeleteLink }) {
  const mobile = useIsMobile()
  const [form, setForm]       = useState(null) // null = fechado, objeto = editando
  const [confirmDel, setConfirmDel] = useState(null)

  const totalAcessos = links.reduce((s, l) => s + (Number(l.acessos) || 0), 0)
  const topLink = links.length > 0
    ? links.reduce((a, b) => (Number(b.acessos) || 0) > (Number(a.acessos) || 0) ? b : a)
    : null

  function openNew() {
    setForm({ ...EMPTY_LINK, id: String(Date.now()) })
  }

  function openEdit(link) {
    setForm({ ...link })
  }

  async function save() {
    if (!form.nome || !form.url) return
    await onSaveLink({ ...form, acessos: form.acessos !== '' ? Number(form.acessos) : 0 })
    setForm(null)
  }

  async function confirmDelete(id) {
    await onDeleteLink(id)
    setConfirmDel(null)
  }

  const pad = mobile ? '12px 14px' : '16px 20px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: mobile ? 8 : 12 }}>
        <div className="card" style={{ padding: pad }}>
          <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Links ativos</p>
          <p style={{ color: '#1C252E', fontSize: mobile ? 20 : 28, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{links.length}</p>
          <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>links parametrizados</p>
        </div>
        <div className="card" style={{ padding: pad }}>
          <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total de acessos</p>
          <p style={{ color: '#FF6200', fontSize: mobile ? 20 : 28, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{fmtN(totalAcessos)}</p>
          <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>soma de todos os links</p>
        </div>
        <div className="card" style={{ padding: pad, gridColumn: mobile ? 'span 2' : 'auto' }}>
          <p style={{ color: '#8A9BB0', fontSize: mobile ? 9 : 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Link mais acessado</p>
          <p style={{ color: '#1C252E', fontSize: mobile ? 14 : 16, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{topLink ? topLink.nome : '—'}</p>
          <p style={{ color: '#A8B5C0', fontSize: mobile ? 9 : 11 }}>{topLink ? `${fmtN(topLink.acessos)} acessos` : 'nenhum link cadastrado'}</p>
        </div>
      </div>

      {/* Links parametrizados */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>Links parametrizados</p>
            <p style={{ color: '#9AAAB8', fontSize: 11, marginTop: 2 }}>Rastreamento de acessos por link do Navarro</p>
          </div>
          {isEditMode && (
            <button onClick={openNew} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FF6200', color: '#fff', border: 'none',
              borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              <Plus size={14}/> Novo link
            </button>
          )}
        </div>

        {links.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Link2 size={28} color="#D0D8E4" style={{ margin: '0 auto 10px', display: 'block' }}/>
            <p style={{ color: '#9AAAB8', fontSize: 14 }}>Nenhum link cadastrado ainda.</p>
            {isEditMode && <p style={{ color: '#C0CEDA', fontSize: 12, marginTop: 4 }}>Clique em "Novo link" para adicionar.</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: mobile ? 0 : 500 }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>Nome / Campanha</th>
                  <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>URL</th>
                  <th style={{ padding: '9px 14px', color: '#8A9BB0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Acessos</th>
                  {isEditMode && <th style={{ padding: '9px 14px', width: 60 }}/>}
                </tr>
              </thead>
              <tbody>
                {[...links].sort((a, b) => (Number(b.acessos) || 0) - (Number(a.acessos) || 0)).map((link, i) => (
                  <tr key={link.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={e => { if (isEditMode) e.currentTarget.style.background = '#FAFBFC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {i === 0 && <span style={{ background: 'rgba(255,98,0,0.1)', color: '#FF6200', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>Top</span>}
                        <span style={{ color: '#1C252E', fontSize: 13, fontWeight: 600 }}>{link.nome || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', maxWidth: mobile ? 140 : 300 }}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#0A66C2', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: mobile ? 130 : 280 }}>
                        <ExternalLink size={11} style={{ flexShrink: 0 }}/>
                        {link.url}
                      </a>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                      <span style={{ color: '#FF6200', fontSize: 14, fontWeight: 800 }}>{fmtN(link.acessos)}</span>
                    </td>
                    {isEditMode && (
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => openEdit(link)} style={{ background: '#F4F6F8', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', display: 'flex', color: '#6B7A8D' }}>
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => setConfirmDel(link.id)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', display: 'flex', color: '#ef4444' }}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Posts — em breve */}
      <div className="card" style={{ padding: mobile ? '14px' : '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <BarChart2 size={16} color="#C0CEDA"/>
          <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>Posts em parceria</p>
        </div>
        <p style={{ color: '#9AAAB8', fontSize: 13 }}>
          Métricas de performance dos posts publicados no perfil do Navarro estarão disponíveis assim que os dados chegarem.
        </p>
      </div>

      {/* Modal — novo/editar link */}
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,46,0.55)', zIndex: 1000, display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: mobile ? 0 : 16 }}
          onClick={e => e.target === e.currentTarget && setForm(null)}>
          <div style={{ background: '#fff', borderRadius: mobile ? '20px 20px 0 0' : 16, width: '100%', maxWidth: mobile ? '100%' : 440, boxShadow: '0 16px 56px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
              <p style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>{form.nome ? 'Editar link' : 'Novo link'}</p>
              <button onClick={() => setForm(null)} style={{ background: '#F4F6F8', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
                <X size={15} color="#8A9BB0"/>
              </button>
            </div>
            <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ color: '#6B7A8D', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nome / Campanha</p>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Landing page ETFs"
                  style={{ width: '100%', border: '1.5px solid #E8ECF0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <p style={{ color: '#6B7A8D', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>URL parametrizada</p>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  style={{ width: '100%', border: '1.5px solid #E8ECF0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}/>
              </div>
              <div>
                <p style={{ color: '#6B7A8D', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Acessos</p>
                <input type="number" value={form.acessos} onChange={e => setForm(f => ({ ...f, acessos: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', border: '1.5px solid #E8ECF0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}/>
              </div>
              <button onClick={save} disabled={!form.nome || !form.url} style={{
                background: '#1C252E', color: '#C3EBF7', border: 'none', borderRadius: 12,
                padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (!form.nome || !form.url) ? 0.5 : 1, marginTop: 4,
              }}>
                <Check size={15}/> Salvar link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 300, width: '90%' }}>
            <p style={{ color: '#1C252E', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Remover link?</p>
            <p style={{ color: '#8A9BB0', fontSize: 13, marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, background: '#F4F6F8', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer', color: '#4A5568' }}>Cancelar</button>
              <button onClick={() => confirmDelete(confirmDel)} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
