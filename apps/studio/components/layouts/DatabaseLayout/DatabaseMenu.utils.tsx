import { useParams } from 'common'

import { useIsColumnLevelPrivilegesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsETLPrivateAlpha } from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import type {
  ProductMenuGroup,
  ProductMenuGroupItem,
} from '@/components/ui/ProductMenu/ProductMenu.types'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const useGenerateDatabaseMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { databaseReplication: showPgReplicate, databaseRoles: showRoles } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
    'integrations:wrappers',
  ])

  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const pitrEnabled = addons?.selected_addons.some((addon) => addon.type === 'pitr') ?? false
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()
  const enablePgReplicate = useIsETLPrivateAlpha()

  const getDatabaseURL = (path: string) => `/project/${ref}/database/${path}`

  return [
    {
      title: 'Gerenciamento de Serviços',
      items: [
        {
          name: 'Visualizador de Arquitetura',
          key: 'schemas',
          url: getDatabaseURL('schemas'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER,
        },
        {
          name: 'Serviços',
          key: 'tables',
          url: getDatabaseURL('tables'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_TABLES,
        },
        {
          name: 'Integrações',
          key: 'functions',
          url: getDatabaseURL('functions'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS,
        },
        {
          name: 'Webhooks',
          key: 'triggers',
          url: getDatabaseURL('triggers/data'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_TRIGGERS,
        },
        {
          name: 'Tipos de Runtime',
          key: 'types',
          url: getDatabaseURL('types'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_TYPES,
        },
        {
          name: 'Extensões de Plataforma',
          key: 'extensions',
          url: getDatabaseURL('extensions'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS,
        },
        {
          name: 'Índices de Cache',
          key: 'indexes',
          url: getDatabaseURL('indexes'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_INDEXES,
        },
        {
          name: 'Canais em Tempo Real',
          key: 'publications',
          url: getDatabaseURL('publications'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS,
        },
      ],
    },
    {
      title: 'Controle de Acesso',
      items: [
        {
          name: 'Políticas de Segurança',
          key: 'policies',
          url: getDatabaseURL('policies'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_POLICIES,
        },
        showRoles && {
          name: 'Perfis',
          key: 'roles',
          url: getDatabaseURL('roles'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_ROLES,
        },
        columnLevelPrivileges && {
          name: 'Privilégios Granulares',
          key: 'column-privileges',
          url: getDatabaseURL('column-privileges'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES,
        },
      ].filter(Boolean) as ProductMenuGroupItem[],
    },
    {
      title: 'Configuração',
      items: [
        {
          name: 'Ajustes',
          key: 'settings',
          url: getDatabaseURL('settings'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_SETTINGS,
        },
      ].filter(Boolean) as ProductMenuGroupItem[],
    },
    {
      title: 'Plataforma',
      items: [
        IS_PLATFORM &&
          showPgReplicate && {
          name: 'Sincronização',
          key: 'replication',
            url: getDatabaseURL('replication'),
            label: enablePgReplicate ? 'Novo' : undefined,
            shortcutId: SHORTCUT_IDS.NAV_DATABASE_REPLICATION,
          },
        IS_PLATFORM && {
          name: 'Snapshots',
          key: 'backups',
          url: pitrEnabled ? getDatabaseURL('backups/pitr') : getDatabaseURL('backups/scheduled'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_BACKUPS,
        },
        {
          name: 'Deploy Automatizado',
          key: 'migrations',
          url: getDatabaseURL('migrations'),
          shortcutId: SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS,
        },
      ].filter(Boolean) as ProductMenuGroupItem[],
    },
  ]
}
