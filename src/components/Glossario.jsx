const GLOSSARIO = [
  { termo: 'Contas alcançadas', icone: '👥', definicao: 'O número de contas únicas do Instagram que viram este post pelo menos uma vez. Essa métrica é estimada pelo Instagram.' },
  { termo: 'Visualizações',     icone: '👁',  definicao: 'O número de vezes que o post foi exibido no total — inclui a mesma conta ver mais de uma vez.' },
  { termo: 'Curtidas',          icone: '❤️', definicao: 'Número de contas que curtiram o post. Representado pelo ícone de coração (♡) no app mobile.' },
  { termo: 'Comentários',       icone: '💬', definicao: 'Número de comentários feitos no post. Representado pelo ícone de balão de fala no app mobile.' },
  { termo: 'Salvamentos',       icone: '🔖', definicao: 'Contas que salvaram o post para ver depois. Representado pelo ícone de marcador/bookmark no app mobile.' },
  { termo: 'Compartilhamentos', icone: '↗️', definicao: 'Inclui encaminhamentos diretos e reposts. Representado pelo ícone de avião de papel ou seta circular no app mobile.' },
  { termo: 'Tempo médio de visualização', icone: '⏱', definicao: 'O tempo médio gasto na reprodução do seu reel. Calculado dividindo o tempo total de visualização pelo número de visualizações iniciais.' },
  { termo: 'Seguidores ganhos', icone: '➕', definicao: 'O número de contas que começaram a seguir o perfil a partir deste post.' },
  { termo: 'Dado parcial',      icone: '🕐', definicao: 'Métricas ainda em atualização — o Instagram pode levar alguns dias para estabilizar os números de alcance e visualizações.' },
  { termo: 'Dado final',        icone: '✓',  definicao: 'Métricas consolidadas e estáveis. Recomendado aguardar ao menos 7 dias após a publicação antes de marcar como final.' },
]

export default function Glossario() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Glossário de métricas</h2>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Definições oficiais do Instagram para cada métrica</p>
      </div>

      <div className="card" style={{ padding: '8px 0', overflow: 'hidden' }}>
        {GLOSSARIO.map((item, i) => (
          <div key={i} style={{
            padding: '16px 22px',
            borderBottom: i < GLOSSARIO.length - 1 ? '1px solid #F5F7FA' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{item.icone}</span>
              <p style={{ color: '#182638', fontSize: 14, fontWeight: 700, margin: 0 }}>{item.termo}</p>
            </div>
            <p style={{ color: '#6B7A8D', fontSize: 13, lineHeight: 1.65, margin: 0, paddingLeft: 26 }}>
              {item.definicao}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
