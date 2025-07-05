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
  }
}

export function CommandBar({ viewModel }: CommandBarProps) {
  const [open, setOpen] = React.useState(false)
  const projects = viewModel.projects
  const workflows = viewModel.workflows
  const widgets = viewModel.widgets
  const currentProjectId = viewModel.currentProjectId
  const currentWorkflowId = viewModel.currentWorkflowId

  const itemStyle = {
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent'
  }

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
        <Command 
          className="rounded-lg border shadow-md"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '500px',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <CommandInput 
            placeholder="Type a command or search..." 
            style={{
              padding: '16px 20px',
              fontSize: '15px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              outline: 'none',
              backgroundColor: '#fafafa'
            }}
          />
          <CommandList 
            style={{
              maxHeight: '400px',
              overflow: 'auto',
              padding: '8px',
              backgroundColor: '#ffffff'
            }}
          >
            <CommandEmpty>No results found.</CommandEmpty>
            
            {/* Quick Actions */}
            <CommandGroup 
              heading="Quick Actions"
              style={{
                marginBottom: '8px'
              }}
            >
              <CommandItem
                onSelect={() => {
                  viewModel.toggleEditMode();
                  setOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Add New Widget</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  // TODO: Implement copy widget
                  setOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Current Widget</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  // TODO: Implement paste widget
                  setOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Paste Widget</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '12px 0', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }} />
            
            {/* Projects */}
            <CommandGroup 
              heading="Projects"
              style={{
                marginBottom: '8px'
              }}
            >
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    viewModel.switchToProject(project.id);
                    setOpen(false);
                  }}
                  style={itemStyle}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {project.name}
                  {project.id === currentProjectId && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '12px 0', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }} />
            
            {/* Workflows */}
            <CommandGroup 
              heading="Workflows"
              style={{
                marginBottom: '8px'
              }}
            >
              {workflows.map((workflow) => (
                <CommandItem
                  key={workflow.id}
                  value={workflow.name}
                  onSelect={() => {
                    viewModel.switchToWorkflow(workflow.id);
                    setOpen(false);
                  }}
                  style={itemStyle}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {workflow.name}
                  {workflow.id === currentWorkflowId && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '12px 0', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }} />
            
            {/* Widgets */}
            <CommandGroup 
              heading="Widgets"
              style={{
                marginBottom: '8px'
              }}
            >
              {widgets.map((widget) => (
                <CommandItem
                  key={widget.id}
                  value={widget.name || widget.type}
                  onSelect={() => {
                    // TODO: Implement focus on widget
                    setOpen(false);
                  }}
                  style={itemStyle}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Square className="mr-2 h-4 w-4" />
                  {widget.name || widget.type}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '12px 0', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }} />
            
            {/* Settings */}
            <CommandGroup 
              heading="Settings"
              style={{
                marginBottom: '8px'
              }}
            >
              <CommandItem
                onSelect={() => {
                  viewModel.openSettings();
                  setOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  viewModel.openAbout();
                  setOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Info className="mr-2 h-4 w-4" />
                <span>About</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
} 