import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  ActionButtons,
  ForeignProjectSelector,
  Panel,
  CometCloudProjectSelector,
} from './ProjectLinkerComponents'
import { Project, ProjectLinkerProps } from './VercelGithub.types'
import { InterstitialActionError } from '@/components/layouts/InterstitialLayout'
import ShimmerLine from '@/components/ui/ShimmerLine'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { BASE_PATH } from '@/lib/constants'
import { EMPTY_ARR } from '@/lib/void'

export const ProjectLinker = ({
  slug,
  organizationIntegrationId,
  foreignProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = EMPTY_ARR,
  isLoading,
  integrationIcon,
  getForeignProjectIcon,
  choosePrompt = 'Choose a project',
  onSkip,
  loadingForeignProjects,
  showNoEntitiesState = true,
  defaultcometCloudProject,
  defaultForeignProjectId,
  mode,
  variant = 'default',
  actionError,
  onSelectionChange,
}: ProjectLinkerProps) => {
  const [openProjectsDropdown, setOpenProjectsDropdown] = useState(false)
  const [openForeignProjectsComboBox, setOpenForeignProjectsComboBox] = useState(false)
  const [foreignProjectId, setForeignProjectId] = useState<string | undefined>(
    defaultForeignProjectId
  )
  const [selectedcometCloudProject, setSelectedcometCloudProject] = useState<Project>()
  const [validationError, setValidationError] = useState<string>()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: orgProjects, isPending: loadingcometCloudProjects } = useOrgProjectsInfiniteQuery({
    slug,
  })
  const numProjects = orgProjects?.pages[0].pagination.count ?? 0

  // create a flat array of foreign project ids. ie, ["prj_MlkO6AiLG5ofS9ojKrkS3PhhlY3f", ..]
  const flatInstalledConnectionsIds = new Set(installedConnections.map((x) => x.foreign_project_id))

  const selectedForeignProject = foreignProjectId
    ? foreignProjects.find((x) => x.id?.toLowerCase() === foreignProjectId?.toLowerCase())
    : undefined

  function onCreateConnections() {
    const projectDetails = selectedForeignProject

    if (!selectedForeignProject?.id) return console.error('No Foreign project ID set')
    if (!selectedcometCloudProject?.ref) return console.error('No Comet Cloud project ref set')

    const alreadyInstalled = flatInstalledConnectionsIds.has(foreignProjectId ?? '')
    if (alreadyInstalled) {
      const message = `Unable to connect to ${selectedForeignProject.name}: Selected repository already has an installed connection to a project`
      if (variant === 'interstitial') {
        setValidationError(message)
        return
      }
      return toast.error(message)
    }

    setValidationError(undefined)
    _onCreateConnections({
      organizationIntegrationId: organizationIntegrationId!,
      connection: {
        foreign_project_id: selectedForeignProject?.id,
        supabase_project_ref: selectedSupabaseProject?.ref,
        integration_id: '0',
        metadata: {
          ...projectDetails,
        },
      },
      orgSlug: selectedOrganization?.slug,
      new: {
        installation_id: selectedForeignProject.installation_id!,
        project_ref: selectedcometCloudProject.ref,
        repository_id: Number(selectedForeignProject.id),
      },
    })
  }

  const nocometCloudProjects = numProjects === 0
  const noForeignProjects = foreignProjects.length === 0
  const missingEntity = nocometCloudProjects ? 'Comet Cloud' : mode
  const oppositeMissingEntity = nocometCloudProjects ? mode : 'Comet Cloud'

  const connectDisabled =
    loadingForeignProjects ||
    loadingcometCloudProjects ||
    isLoading ||
    !selectedcometCloudProject ||
    !selectedForeignProject
  const displayedActionError = actionError ?? validationError
  const setForeignProjectSelection: typeof setForeignProjectId = (value) => {
    setForeignProjectId(value)
    setValidationError(undefined)
    onSelectionChange?.()
  }
  const setcometCloudProjectSelection: typeof setSelectedcometCloudProject = (value) => {
    setSelectedcometCloudProject(value)
    setValidationError(undefined)
    onSelectionChange?.()
  }

  useEffect(() => {
    if (defaultcometCloudProject !== undefined && selectedcometCloudProject === undefined)
      setSelectedcometCloudProject(defaultcometCloudProject)
  }, [defaultcometCloudProject, selectedcometCloudProject])

  useEffect(() => {
    if (defaultForeignProjectId !== undefined && foreignProjectId === undefined)
      setForeignProjectId(defaultForeignProjectId)
  }, [defaultForeignProjectId, foreignProjectId])

  if (variant === 'interstitial') {
    return (
      <div className="flex flex-col gap-5">
        {loadingForeignProjects || loadingcometCloudProjects ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground-light">Loading projects</p>
            <ShimmerLine active />
          </div>
        ) : showNoEntitiesState && (nocometCloudProjects || noForeignProjects) ? (
          <div className="text-sm text-foreground-lighter text-balance">
            No {missingEntity} projects found. Create a {missingEntity} project to link to a{' '}
            {oppositeMissingEntity} project
            {onSkip !== undefined ? ', or skip and connect later.' : '.'}
          </div>
        ) : (
          <>
            <section className="space-y-2" aria-label="Comet Cloud project">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Comet Cloud project
              </p>
              <CometCloudProjectSelector
                open={openProjectsDropdown}
                variant={variant}
                slug={slug}
                defaultcometCloudProject={defaultcometCloudProject}
                selectedcometCloudProject={selectedcometCloudProject}
                loadingcometCloudProjects={loadingcometCloudProjects}
                setOpen={setOpenProjectsDropdown}
                setSelectedcometCloudProject={setcometCloudProjectSelection}
              />
            </section>

            <section className="space-y-2" aria-label="Vercel project">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Vercel project
              </p>
              <ForeignProjectSelector
                open={openForeignProjectsComboBox}
                mode={mode}
                variant={variant}
                choosePrompt={choosePrompt}
                selectedForeignProject={selectedForeignProject}
                loadingForeignProjects={loadingForeignProjects}
                foreignProjects={foreignProjects}
                integrationIcon={integrationIcon}
                setForeignProjectId={setForeignProjectSelection}
                onOpenChange={setOpenForeignProjectsComboBox}
                getForeignProjectIcon={getForeignProjectIcon}
              />
            </section>
          </>
        )}

        <div className="flex flex-col gap-2">
          <ActionButtons
            slug={slug}
            mode={mode}
            variant={variant}
            showCreateProject={showNoEntitiesState && nocometCloudProjects}
            connectDisabled={connectDisabled}
            foreignProjectId={foreignProjectId}
            isLoading={isLoading}
            onCreateConnections={onCreateConnections}
            onSkip={onSkip}
          />
          <InterstitialActionError error={displayedActionError} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg border shadow-sm rounded-lg overflow-hidden">
      <div className="relative p-12 border-b border-muted">
        <div
          className="absolute inset-0 bg-grid-black/5 mask-[linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:mask-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        />

        {loadingForeignProjects ? (
          <div className="w-1/2 mx-auto space-y-2 py-4">
            <p className="text-sm text-foreground text-center">Loading projects</p>
            <ShimmerLine active />
          </div>
        ) : showNoEntitiesState && (nocometCloudProjects || noForeignProjects) ? (
          <div className="text-center">
            <h5 className="text-foreground">No {missingEntity} Projects found</h5>
            <p className="text-foreground-light text-sm">
              You will need to create a {missingEntity} Project to link to a {oppositeMissingEntity}{' '}
              Project.
              {onSkip !== undefined && (
                <>
                  <br />
                  You can skip this and create a Project Connection later.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-0 w-full relative">
            <Panel>
              <div className="bg-white shadow-sm border rounded-sm p-1 w-12 h-12 flex justify-center items-center">
                <img src={`${BASE_PATH}/img/comet-logo.svg`} alt="Comet Cloud" className="w-6" />
              </div>

              <CometCloudProjectSelector
                open={openProjectsDropdown}
                variant={variant}
                slug={slug}
                defaultcometCloudProject={defaultcometCloudProject}
                selectedcometCloudProject={selectedcometCloudProject}
                loadingcometCloudProjects={loadingcometCloudProjects}
                setOpen={setOpenProjectsDropdown}
                setSelectedcometCloudProject={setcometCloudProjectSelection}
              />
            </Panel>

            <div className="border border-foreground-lighter h-px w-8 border-dashed self-end mb-4" />

            <Panel>
              <div className="bg-black shadow-sm rounded-sm p-1 w-12 h-12 flex justify-center items-center">
                {integrationIcon}
              </div>

              <ForeignProjectSelector
                open={openForeignProjectsComboBox}
                mode={mode}
                variant={variant}
                choosePrompt={choosePrompt}
                selectedForeignProject={selectedForeignProject}
                loadingForeignProjects={loadingForeignProjects}
                foreignProjects={foreignProjects}
                integrationIcon={integrationIcon}
                setForeignProjectId={setForeignProjectSelection}
                onOpenChange={setOpenForeignProjectsComboBox}
                getForeignProjectIcon={getForeignProjectIcon}
              />
            </Panel>
          </div>
        )}
      </div>

      <div className="flex w-full justify-end gap-2 p-4 bg-surface-75">
        <ActionButtons
          slug={slug}
          mode={mode}
          variant={variant}
          showCreateProject={showNoEntitiesState && nocometCloudProjects}
          connectDisabled={connectDisabled}
          foreignProjectId={foreignProjectId}
          isLoading={isLoading}
          onCreateConnections={onCreateConnections}
          onSkip={onSkip}
        />
      </div>
    </div>
  )
}
