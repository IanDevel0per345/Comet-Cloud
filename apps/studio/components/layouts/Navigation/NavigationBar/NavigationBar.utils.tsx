import { useParams } from 'common'
import { Auth, Database, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { Blocks, Settings, Telescope } from 'lucide-react'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@/components/interfaces/Sidebar'
import type { Route } from '@/components/ui/ui.types'
import { EditorIndexPageLink } from '@/data/prefetchers/project.$ref.editor'
import type { Project } from '@/data/projects/project-detail-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface RouteContext {
  ref?: string
  isProjectActive: boolean
  isProjectBuilding: boolean
  buildingUrl: string
}

interface ProductFeatures {
  auth?: boolean
  edgeFunctions?: boolean
  storage?: boolean
  realtime?: boolean
  authOverviewPage?: boolean
}

interface OtherFeatures {
  isPlatform?: boolean
  unifiedLogs?: boolean
  showReports?: boolean
  showLogs?: boolean
}

function getRouteContext(ref?: string, project?: Project): RouteContext {
  return {
    ref,
    isProjectActive: project?.status === PROJECT_STATUS.ACTIVE_HEALTHY,
    isProjectBuilding: project?.status === PROJECT_STATUS.COMING_UP,
    buildingUrl: `/project/${ref}`,
  }
}

export const generateToolRoutes = (ref?: string, project?: Project): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  return [
    {
      key: 'editor',
      label: 'Serviços',
      disabled: !isProjectActive,
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
      linkElement: <EditorIndexPageLink projectRef={ref} />,
      shortcutId: SHORTCUT_IDS.NAV_TABLE_EDITOR,
    },
    {
      key: 'sql',
      label: 'Console de Deploy',
      disabled: !isProjectActive,
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
      shortcutId: SHORTCUT_IDS.NAV_SQL_EDITOR,
    },
  ]
}

export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: ProductFeatures
): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  const authEnabled = features?.auth ?? true
  const storageEnabled = features?.storage ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const realtimeEnabled = features?.realtime ?? true
  const authOverviewPageEnabled = features?.authOverviewPage ?? false

  return [
    {
      key: 'database',
      label: 'Serviços',
      description: 'Serviços hospedados',
      disabled: !isProjectActive,
      icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : isProjectActive
            ? `/project/${ref}/database/schemas`
            : `/project/${ref}/database/backups/scheduled`),
      shortcutId: SHORTCUT_IDS.NAV_DATABASE,
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: 'Equipe e Acesso',
            description: 'Membros e permissões',
            disabled: !isProjectActive,
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding
                ? buildingUrl
                : authOverviewPageEnabled
                  ? `/project/${ref}/auth/overview`
                  : `/project/${ref}/auth/users`),
            shortcutId: SHORTCUT_IDS.NAV_AUTH,
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: 'Armazenamento',
            description: 'Volumes e arquivos',
            disabled: !isProjectActive,
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/files`),
            shortcutId: SHORTCUT_IDS.NAV_STORAGE,
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: 'Integrações',
            description: 'GitHub, Webhooks e CLI',
            disabled: false,
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/project/${ref}/functions`,
            shortcutId: SHORTCUT_IDS.NAV_FUNCTIONS,
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: 'Logs',
            description: 'Logs e monitoramento',
            disabled: !isProjectActive,
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
            shortcutId: SHORTCUT_IDS.NAV_REALTIME,
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  ref?: string,
  project?: Project,
  features?: OtherFeatures
): Route[] => {
  const { isProjectActive, isProjectBuilding, buildingUrl } = getRouteContext(ref, project)

  const reportsEnabled = features?.showReports ?? true

  return [
    ...(reportsEnabled
      ? [
          {
            key: 'observability',
            label: 'Monitoramento',
            disabled: !isProjectActive,
            icon: <Telescope size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding
                ? buildingUrl
                : IS_PLATFORM
                  ? `/project/${ref}/observability`
                  : `/project/${ref}/query-performance`),
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY,
          },
        ]
      : []),
    {
      key: 'integrations',
      label: 'Billing',
      disabled: !isProjectActive,
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/integrations`),
      shortcutId: SHORTCUT_IDS.NAV_INTEGRATIONS,
    },
  ]
}

// [Joshen] Main hook to consume as it standardizes the generation of the menu items
export const useGenerateOtherRoutes = (): Route[] => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { isEnabled: unifiedLogsEnabled } = useUnifiedLogsPreview()
  const reportsEnabled = useIsFeatureEnabled('reports:all')
  const logsEnabled = useIsFeatureEnabled('logs:all')

  return generateOtherRoutes(ref, project, {
    unifiedLogs: unifiedLogsEnabled,
    showReports: reportsEnabled,
    showLogs: logsEnabled,
  })
}

export const generateSettingsRoutes = (ref?: string): Route[] => {
  return [
    {
      key: 'settings',
      label: 'Configurações',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && `/project/${ref}/settings/general`,
      disabled: false,
      shortcutId: SHORTCUT_IDS.NAV_SETTINGS,
    },
  ]
}
