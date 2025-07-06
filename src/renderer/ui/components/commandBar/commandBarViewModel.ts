import { UseAppState } from '@/ui/hooks/appState'
import { getOneFromEntityCollection } from '@/base/entityCollection'
import { CopyWidgetUseCase } from '@/application/useCases/widget/copyWidget'
import { PasteWidgetToWorkflowUseCase } from '@/application/useCases/workflow/pasteWidgetToWorkflow'
import { SwitchProjectUseCase } from '@/application/useCases/projectSwitcher/switchProject'
import { SwitchWorkflowUseCase } from '@/application/useCases/workflowSwitcher/switchWorkflow'
import { OpenApplicationSettingsUseCase } from '@/application/useCases/applicationSettings/openApplicationSettings'
import { OpenAboutUseCase } from '@/application/useCases/about/openAbout'
import { ToggleEditModeUseCase } from '@/application/useCases/toggleEditMode'
import { OpenNewWindowUseCase } from '@/application/useCases/browserWindow/openNewWindow'
import { ReloadWindowUseCase } from '@/application/useCases/browserWindow/reloadWindow'

type Deps = {
  useAppState: UseAppState
  toggleEditModeUseCase: ToggleEditModeUseCase
  copyWidgetUseCase: CopyWidgetUseCase
  pasteWidgetToWorkflowUseCase: PasteWidgetToWorkflowUseCase
  switchProjectUseCase: SwitchProjectUseCase
  switchWorkflowUseCase: SwitchWorkflowUseCase
  openApplicationSettingsUseCase: OpenApplicationSettingsUseCase
  openAboutUseCase: OpenAboutUseCase
  openNewWindowUseCase: OpenNewWindowUseCase
  reloadWindowUseCase: ReloadWindowUseCase
}

export function createCommandBarViewModelHook({
  useAppState,
  toggleEditModeUseCase,
  copyWidgetUseCase,
  pasteWidgetToWorkflowUseCase,
  switchProjectUseCase,
  switchWorkflowUseCase,
  openApplicationSettingsUseCase,
  openAboutUseCase,
  openNewWindowUseCase,
  reloadWindowUseCase,
}: Deps) {
  function useCommandBarViewModel() {
    const [
      projects,
      currentProjectId,
      workflows,
      widgets,
      editMode,
    ] = useAppState(state => [
      state.entities.projects,
      state.ui.projectSwitcher.currentProjectId,
      state.entities.workflows,
      state.entities.widgets,
      state.ui.editMode,
    ])

    const currentProject = getOneFromEntityCollection(projects, currentProjectId)
    const currentWorkflowId = currentProject?.currentWorkflowId ?? null
    const currentWorkflow = currentWorkflowId ? getOneFromEntityCollection(workflows, currentWorkflowId) : null

    // Transform data for the command bar
    const projectList = Object.values(projects)
      .filter((p): p is NonNullable<typeof p> => p != null && p.id != null && p.settings != null)
      .map(p => ({
        id: p.id,
        name: p.settings.name
      }))

    const workflowList = currentProject
      ? currentProject.workflowIds.map(wfId => {
          const workflow = getOneFromEntityCollection(workflows, wfId)
          return workflow ? {
            id: workflow.id,
            name: workflow.settings.name
          } : null
        }).filter(Boolean) as Array<{ id: string; name: string }>
      : []

    const widgetList = currentWorkflow
      ? currentWorkflow.layout.map(layoutItem => {
          const widget = getOneFromEntityCollection(widgets, layoutItem.widgetId)
          if (widget && 'coreSettings' in widget && 'type' in widget) {
            return {
              id: widget.id,
              name: widget.coreSettings.name || `${widget.type} Widget`,
              type: widget.type
            }
          }
          return null
        }).filter(Boolean) as Array<{ id: string; name: string; type: string }>
      : []

    return {
      projects: projectList,
      workflows: workflowList,
      widgets: widgetList,
      currentProjectId,
      currentWorkflowId,
      toggleEditMode: () => {
        toggleEditModeUseCase()
      },
      switchToProject: (projectId: string) => {
        switchProjectUseCase(projectId)
      },
      switchToWorkflow: (workflowId: string) => {
        if (currentProjectId) {
          switchWorkflowUseCase(currentProjectId, workflowId)
        }
      },
      openSettings: () => {
        openApplicationSettingsUseCase()
      },
      openAbout: () => {
        openAboutUseCase()
      },
      openNewWindow: () => {
        openNewWindowUseCase()
      },
      reloadWindow: () => {
        reloadWindowUseCase()
      }
    }
  }

  return useCommandBarViewModel
}

export type CommandBarViewModelHook = ReturnType<typeof createCommandBarViewModelHook>
export type CommandBarViewModel = ReturnType<CommandBarViewModelHook> 