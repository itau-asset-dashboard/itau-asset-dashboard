import { Users, Eye, Heart, MessageCircle, Bookmark, Share2, Clock, UserPlus, AlertCircle, CheckCircle, Play, Zap, UserCheck } from 'lucide-react'

const FEED = [
  { termo: 'Contas alcançadas',   icon: Users,         color: '#FF6200', bg: 'rgba(255,98,0,0.08)',    definicao: 'Número de contas únicas do Instagram que viram este post pelo menos uma vez. Essa métrica é estimada pelo Instagram.' },
  { termo: 'Visualizações',       icon: Eye,           color: '#1C252E', bg: 'rgba(195,235,247,0.25)',     definicao: 'Número de vezes que o post foi exibido no total — inclui a mesma conta ver mais de uma vez.' },
  { termo: 'Curtidas',            icon: Heart,         color: '#E11D48', bg: 'rgba(225,29,72,0.08)',     definicao: 'Número de contas que curtiram o post. Representado pelo ícone de coração no app mobile.' },
  { termo: 'Comentários',         icon: MessageCircle, color: '#FF6200', bg: 'rgba(28,37,46,0.06)',    definicao: 'Número de comentários feitos no post. Representado pelo ícone de balão de fala no app mobile.' },
  { termo: 'Salvamentos',         icon: Bookmark,      color: '#1C252E', bg: 'rgba(28,37,46,0.06)',     definicao: 'Contas que salvaram o post para ver depois. Representado pelo ícone de marcador/bookmark no app mobile.' },
  { termo: 'Compartilhamentos',   icon: Share2,        color: '#0F7EC0', bg: 'rgba(15,126,192,0.08)',    definicao: 'Inclui encaminhamentos diretos e reposts. Representado pelo ícone de avião de papel ou seta circular no app mobile.' },
  { termo: 'Tempo médio de visualização', icon: Clock, color: '#D97706', bg: 'rgba(217,119,6,0.08)',    definicao: 'Tempo médio gasto na reprodução do reel. Calculado dividindo o tempo total de visualização pelo número de visualizações iniciais.' },
  { termo: 'Seguidores ganhos',   icon: UserPlus,      color: '#1C252E', bg: 'rgba(195,235,247,0.25)',     definicao: 'Número de contas que começaram a seguir o perfil a partir deste post.' },
  { termo: 'Dado parcial',        icon: AlertCircle,   color: '#D97706', bg: 'rgba(217,119,6,0.08)',     definicao: 'Métricas ainda em atualização — o Instagram pode levar alguns dias para estabilizar os números de alcance e visualizações.' },
  { termo: 'Dado final',          icon: CheckCircle,   color: '#1C252E', bg: 'rgba(28,37,46,0.06)',     definicao: 'Métricas consolidadas e estáveis. Recomendado aguardar ao menos 7 dias após a publicação antes de marcar como final.' },
]

const STORIES = [
  { termo: 'Visualizações',       icon: Play,      color: '#1C252E', bg: 'rgba(195,235,247,0.25)',  definicao: 'O número de vezes que seu story foi reproduzido ou exibido.' },
  { termo: 'Interações com stories', icon: Zap,    color: '#FF6200', bg: 'rgba(255,98,0,0.08)', definicao: 'O número de curtidas, respostas e compartilhamentos do seu story menos o número de descurtidas. Essa métrica está em desenvolvimento pelo Instagram.' },
  { termo: 'Atividade do perfil', icon: UserCheck, color: '#1C252E', bg: 'rgba(28,37,46,0.06)', definicao: 'O número de ações que as pessoas realizam quando visitam seu perfil depois de interagir com seu story. Essas ações incluem visitas ao perfil, cliques no link da bio e interações em outras publicações do feed.' },
]

function Section({ title, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <p style={{ color: '#1C252E', fontSize: 14, fontWeight: 700 }}>{title}</p>
        <div style={{ flex: 1, height: 1, background: '#F0F2F5' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {items.map(({ termo, definicao, icon: Icon, color, bg }) => (
          <div key={termo} className="card" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} color={color} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#182638', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{termo}</p>
              <p style={{ color: '#6B7A8D', fontSize: 12, lineHeight: 1.65 }}>{definicao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Glossario() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Glossário de métricas</h2>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Definições oficiais do Instagram para feed e stories</p>
      </div>
      <Section title="Feed" items={FEED} />
      <Section title="Stories" items={STORIES} />
    </div>
  )
}
