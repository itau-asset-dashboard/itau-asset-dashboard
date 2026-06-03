import { Users, Eye, Heart, MessageCircle, Bookmark, Share2, Clock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

const GLOSSARIO = [
  {
    termo: 'Contas alcançadas',
    definicao: 'Número de contas únicas do Instagram que viram este post pelo menos uma vez. Essa métrica é estimada pelo Instagram.',
    icon: Users,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
  },
  {
    termo: 'Visualizações',
    definicao: 'Número de vezes que o post foi exibido no total — inclui a mesma conta ver mais de uma vez.',
    icon: Eye,
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.08)',
  },
  {
    termo: 'Curtidas',
    definicao: 'Número de contas que curtiram o post. Representado pelo ícone de coração no app mobile.',
    icon: Heart,
    color: '#E11D48',
    bg: 'rgba(225,29,72,0.08)',
  },
  {
    termo: 'Comentários',
    definicao: 'Número de comentários feitos no post. Representado pelo ícone de balão de fala no app mobile.',
    icon: MessageCircle,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    termo: 'Salvamentos',
    definicao: 'Contas que salvaram o post para ver depois. Representado pelo ícone de marcador/bookmark no app mobile.',
    icon: Bookmark,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
  {
    termo: 'Compartilhamentos',
    definicao: 'Inclui encaminhamentos diretos e reposts. Representado pelo ícone de avião de papel ou seta circular no app mobile.',
    icon: Share2,
    color: '#0F7EC0',
    bg: 'rgba(15,126,192,0.08)',
  },
  {
    termo: 'Tempo médio de visualização',
    definicao: 'Tempo médio gasto na reprodução do reel. Calculado dividindo o tempo total de visualização pelo número de visualizações iniciais.',
    icon: Clock,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    termo: 'Seguidores ganhos',
    definicao: 'Número de contas que começaram a seguir o perfil a partir deste post.',
    icon: UserPlus,
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.08)',
  },
  {
    termo: 'Dado parcial',
    definicao: 'Métricas ainda em atualização — o Instagram pode levar alguns dias para estabilizar os números de alcance e visualizações.',
    icon: AlertCircle,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    termo: 'Dado final',
    definicao: 'Métricas consolidadas e estáveis. Recomendado aguardar ao menos 7 dias após a publicação antes de marcar como final.',
    icon: CheckCircle,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
]

export default function Glossario() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h2 style={{ color: '#1C252E', fontSize: 15, fontWeight: 700 }}>Glossário de métricas</h2>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 2 }}>Definições oficiais do Instagram para cada métrica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {GLOSSARIO.map(({ termo, definicao, icon: Icon, color, bg }) => (
          <div key={termo} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={16} color={color} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#182638', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{termo}</p>
              <p style={{ color: '#6B7A8D', fontSize: 12, lineHeight: 1.65 }}>{definicao}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
