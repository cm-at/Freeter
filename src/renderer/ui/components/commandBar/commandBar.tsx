import * as React from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command"
import {
  Plus,
  Copy,
  Clipboard,
  FolderOpen,
  FileText,
  Settings,
  Terminal,
  Clock,
  CheckSquare,
  Globe,
  StickyNote,
  CheckCircle,
  Square,
  Info,
  Link,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

export interface CommandBarProps {
  viewModel: {
    projects: Array<{ id: string; name: string }>
    workflows: Array<{ id: string; name: string }>
    widgets: Array<{ id: string; name: string; type: string }>
    currentProjectId: string | null
    currentWorkflowId: string | null
    toggleEditMode: () => void
    switchToProject: (projectId: string) => void
    switchToWorkflow: (workflowId: string) => void
    openSettings: () => void
    openAbout: () => void
    openNewWindow: () => void
    reloadWindow: () => void
  }
}

export function CommandBar({ viewModel }: CommandBarProps) {
  const [open, setOpen] = React.useState(false)
  const projects = viewModel.projects
  const workflows = viewModel.workflows
  const widgets = viewModel.widgets
  const currentProjectId = viewModel.currentProjectId
  const currentWorkflowId = viewModel.currentWorkflowId

  const iconStyle = { color: 'var(--freeter-componentColor90)' }
  const activeIconStyle = { color: 'var(--freeter-primary)' }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {/* Quick Actions */}
            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  viewModel.openNewWindow();
                  setOpen(false);
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" style={iconStyle} />
                <span>New Window</span>
                <CommandShortcut>⌘⇧N</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  viewModel.reloadWindow();
                  setOpen(false);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" style={iconStyle} />
                <span>Reload App</span>
                <CommandShortcut>⌘R</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  viewModel.toggleEditMode();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" style={iconStyle} />
                <span>Add New Widget</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  // TODO: Implement copy widget
                  setOpen(false);
                }}
              >
                <Copy className="mr-2 h-4 w-4" style={iconStyle} />
                <span>Copy Current Widget</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  // TODO: Implement paste widget
                  setOpen(false);
                }}
              >
                <Clipboard className="mr-2 h-4 w-4" style={iconStyle} />
                <span>Paste Widget</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Projects */}
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    viewModel.switchToProject(project.id);
                    setOpen(false);
                  }}
                >
                  <FolderOpen className="mr-2 h-4 w-4" style={iconStyle} />
                  {project.name}
                  {project.id === currentProjectId && (
                    <CheckCircle className="ml-auto h-4 w-4" style={activeIconStyle} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Workflows */}
            <CommandGroup heading="Workflows">
              {workflows.map((workflow) => (
                <CommandItem
                  key={workflow.id}
                  value={workflow.name}
                  onSelect={() => {
                    viewModel.switchToWorkflow(workflow.id);
                    setOpen(false);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" style={iconStyle} />
                  {workflow.name}
                  {workflow.id === currentWorkflowId && (
                    <CheckCircle className="ml-auto h-4 w-4" style={activeIconStyle} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Widgets */}
            <CommandGroup heading="Widgets">
              {widgets.map((widget) => (
                <CommandItem
                  key={widget.id}
                  value={widget.name || widget.type}
                  onSelect={() => {
                    // TODO: Implement focus on widget
                    setOpen(false);
                  }}
                >
                  <Square className="mr-2 h-4 w-4" style={iconStyle} />
                  {widget.name || widget.type}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Settings */}
            <CommandGroup heading="Settings">
              <CommandItem
                onSelect={() => {
                  viewModel.openSettings();
                  setOpen(false);
                }}
              >
                <Settings className="mr-2 h-4 w-4" style={iconStyle} />
                <span>Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  viewModel.openAbout();
                  setOpen(false);
                }}
              >
                <Info className="mr-2 h-4 w-4" style={iconStyle} />
                <span>About</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
} 