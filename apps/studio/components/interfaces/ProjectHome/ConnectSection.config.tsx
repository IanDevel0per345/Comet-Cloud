import { Globe, KeyRound, Rocket, Server, Terminal, Users } from 'lucide-react'
import type { ReactNode } from 'react'

export type ConnectAction = {
  id: string
  heading: string
  subheading: string
  icon: ReactNode
  href?: string
  requiresActiveProject?: boolean
}

export const CONNECT_ACTIONS: ConnectAction[] = [
  {
    id: 'new_service',
    heading: 'Criar serviço',
    subheading: 'Hospede seu bot, API ou site',
    icon: <Server size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/services/new',
  },
  {
    id: 'deploy_console',
    heading: 'Console de Deploy',
    subheading: 'Execute deploys e comandos',
    icon: <Terminal size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/sql',
  },
  {
    id: 'custom_domain',
    heading: 'Domínio personalizado',
    subheading: 'Conecte e proteja seu domínio',
    icon: <Globe size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/settings/domains',
  },
  {
    id: 'deploy_bot',
    heading: 'Deployar agora',
    subheading: 'Deploy de lançamento em um clique',
    icon: <Rocket size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/sql',
  },
  {
    id: 'team',
    heading: 'Convidar membro',
    subheading: 'Adicione sua equipe ao projeto',
    icon: <Users size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/auth',
    requiresActiveProject: false,
  },
  {
    id: 'api_keys',
    heading: 'Chaves de API',
    subheading: 'Gerencie as chaves do projeto',
    icon: <KeyRound size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/settings/api-keys',
    requiresActiveProject: false,
  },
]
