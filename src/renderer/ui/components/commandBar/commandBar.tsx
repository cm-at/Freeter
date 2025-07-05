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

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      console.log('[CommandBar] Key pressed:', e.key, 'Meta:', e.metaKey, 'Ctrl:', e.ctrlKey);
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        console.log('[CommandBar] Toggle command bar');
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      {/* Debug indicator */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          padding: '5px 10px', 
          backgroundColor: open ? 'green' : 'red', 
          color: 'white', 
          zIndex: 10001,
          fontSize: '12px'
        }}
      >
        CommandBar: {open ? 'OPEN' : 'CLOSED'}
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command 
          className="rounded-lg border shadow-md"
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            maxHeight: '500px',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <CommandInput 
            placeholder="Type a command or search..." 
            style={{
              padding: '12px',
              fontSize: '14px',
              borderBottom: '1px solid #e5e7eb',
              outline: 'none'
            }}
          />
          <CommandList 
            style={{
              maxHeight: '400px',
              overflow: 'auto',
              padding: '8px'
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
                  console.log('Add New Widget selected');
                  viewModel.toggleEditMode();
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Add New Widget</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  console.log('Copy Widget selected');
                  // TODO: Implement copy widget
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Current Widget</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  console.log('Paste Widget selected');
                  // TODO: Implement paste widget
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Paste Widget</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '8px 0', borderTop: '1px solid #e5e7eb' }} />
            
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
                    console.log('Project selected:', project.name);
                    viewModel.switchToProject(project.id);
                    setOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {project.name}
                  {project.id === currentProjectId && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '8px 0', borderTop: '1px solid #e5e7eb' }} />
            
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
                    console.log('Workflow selected:', workflow.name);
                    viewModel.switchToWorkflow(workflow.id);
                    setOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {workflow.name}
                  {workflow.id === currentWorkflowId && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '8px 0', borderTop: '1px solid #e5e7eb' }} />
            
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
                    console.log('Widget selected:', widget.name);
                    // TODO: Implement focus on widget
                    setOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Square className="mr-2 h-4 w-4" />
                  {widget.name || widget.type}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator style={{ margin: '8px 0', borderTop: '1px solid #e5e7eb' }} />
            
            {/* Settings */}
            <CommandGroup 
              heading="Settings"
              style={{
                marginBottom: '8px'
              }}
            >
              <CommandItem
                onSelect={() => {
                  console.log('Settings selected');
                  viewModel.openSettings();
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  console.log('About selected');
                  viewModel.openAbout();
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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