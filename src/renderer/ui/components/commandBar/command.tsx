import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "../../lib/utils"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    style={{
      backgroundColor: 'var(--freeter-modalScreenBackground)',
      border: '1px solid var(--freeter-componentBorder)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
      maxHeight: '500px',
      width: '100%',
      overflow: 'hidden',
      color: 'var(--freeter-componentColor)'
    }}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {
  className?: string
}

const CommandDialog = ({ children, className, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className={cn("overflow-hidden p-0 shadow-lg", className)} style={{
        backgroundColor: 'var(--freeter-modalScreenBackground)',
        padding: 0,
        overflow: 'hidden',
        maxWidth: '640px',
        borderRadius: '12px'
      }}>
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Command menu for quick navigation and actions
        </DialogDescription>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" style={{
    borderBottom: '1px solid var(--freeter-componentBorder)',
    backgroundColor: 'var(--freeter-inputBackground)'
  }}>
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" style={{ color: 'var(--freeter-componentColor80)' }} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        padding: '16px 8px',
        fontSize: '15px',
        outline: 'none',
        backgroundColor: 'transparent',
        width: '100%',
        border: 'none',
        color: 'var(--freeter-inputColor)'
      }}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    style={{
      maxHeight: '400px',
      overflow: 'auto',
      padding: '8px',
      backgroundColor: 'var(--freeter-modalScreenBackground)'
    }}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    style={{
      padding: '24px',
      textAlign: 'center',
      color: 'var(--freeter-componentColor80)'
    }}
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <>
    <style>{`
      [cmdk-group-heading] {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: var(--freeter-componentColor80) !important;
        padding: 8px 12px 4px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
      }
    `}</style>
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "overflow-hidden p-1 text-foreground",
        className
      )}
      style={{
        marginBottom: '8px'
      }}
      {...props}
    />
  </>
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    style={{
      margin: '12px 0',
      borderTop: '1px solid var(--freeter-componentBorder)',
      height: '1px'
    }}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    style={{
      padding: '10px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--freeter-componentColor)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--freeter-buttonHoverBackground)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      style={{
        marginLeft: 'auto',
        fontSize: '12px',
        color: 'var(--freeter-componentColor70)',
        letterSpacing: '0.05em'
      }}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} 