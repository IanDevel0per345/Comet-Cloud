import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const {
    authenticationSignInProviders,
    authenticationThirdPartyAuth,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationPerformance,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:performance',
  ])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-auth-users',
        name: 'Usuários',
        value: 'Auth: Usuários',
        route: `/project/${ref}/auth/users`,
        defaultHidden: true,
      },
      ...(authenticationSignInProviders
        ? [
            {
              id: 'nav-auth-providers',
              name: 'Provedores',
              value: 'Auth: Provedores (Login Social, SSO)',
              route: `/project/${ref}/auth/providers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationThirdPartyAuth
        ? [
            {
              id: 'nav-auth-providers-third-party',
              name: 'Provedores (Terceiros)',
              value: 'Auth: Provedores (Terceiros)',
              route: `/project/${ref}/auth/third-party`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-sessions',
        name: 'Sessões',
        value: 'Auth: Sessões (Sessões de Usuário)',
        route: `/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      ...(authenticationRateLimits
        ? [
            {
              id: 'nav-auth-rate-limits',
              name: 'Limites de Requisição',
              value: 'Auth: Limites de Requisição',
              route: `/project/${ref}/auth/rate-limits`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationEmails
        ? [
            {
              id: 'nav-auth-templates',
              name: 'Modelos de E-mail',
              value: 'Auth: Modelos de E-mail',
              route: `/project/${ref}/auth/templates`,
              defaultHidden: true,
            } as IRouteCommand,
            {
              id: 'nav-auth-smtp',
              name: 'Configurações SMTP',
              value: 'Auth: Configurações SMTP (E-mail)',
              route: `/project/${ref}/auth/smtp`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationMultiFactor
        ? [
            {
              id: 'nav-auth-mfa',
              name: 'Autenticação Multifator (MFA)',
              value: 'Auth: Autenticação Multifator (MFA)',
              route: `/project/${ref}/auth/mfa`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-url-configuration',
        name: 'Configuração de URLs',
        value: 'Auth: Configuração de URLs (URL do site, Redirecionamentos)',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      ...(authenticationAttackProtection
        ? [
            {
              id: 'nav-auth-attack-protection',
              name: 'Proteção contra Ataques',
              value: 'Auth: Proteção contra Ataques',
              route: `/project/${ref}/auth/protection`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-auth-hooks',
        name: 'Hooks de Autenticação',
        value: 'Auth: Hooks de Autenticação',
        route: `/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      ...(authenticationPerformance
        ? [
            {
              id: 'nav-auth-performance-settings',
              name: 'Desempenho da Autenticação',
              value: 'Auth: Desempenho',
              route: `/project/${ref}/auth/performance`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
