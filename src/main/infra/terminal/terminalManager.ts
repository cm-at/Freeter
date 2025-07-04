import { ipcMain } from 'electron';
import { IPC_TERMINAL_CHANNEL } from '../../../common/ipc/channels';
import os from 'os';
import * as pty from 'node-pty';

/**
 * Wraps a node-pty instance so the rest of the app keeps the same API it used for the mock.
 */
class NodePtyTerminal {
  pid: number;
  private term: pty.IPty;
  private dataDisposable: pty.IDisposable | null = null;
  private exitDisposable: pty.IDisposable | null = null;

  constructor(shell: string, cwd: string | undefined) {
    const cols = 80;
    const rows = 24;
    console.log(`[NodePtyTerminal] Creating real terminal with shell: ${shell}, cwd: ${cwd || 'default'}`);
    
    this.term = pty.spawn(shell, [], {
      cols,
      rows,
      cwd: cwd || os.homedir(),
      env: Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)) as { [key: string]: string },
    });
    this.pid = this.term.pid;
  }

  onData(callback: (data: string) => void): void {
    // Dispose of any existing listener
    if (this.dataDisposable) {
      this.dataDisposable.dispose();
    }
    // Set up new listener
    this.dataDisposable = this.term.onData(callback);
  }

  onExit(callback: () => void): void {
    // Dispose of any existing listener
    if (this.exitDisposable) {
      this.exitDisposable.dispose();
    }
    // Set up new listener
    this.exitDisposable = this.term.onExit(() => callback());
  }

  write(data: string): void {
    this.term.write(data);
  }

  resize(cols: number, rows: number): void {
    this.term.resize(cols, rows);
  }

  kill(): void {
    // Dispose of listeners
    if (this.dataDisposable) {
      this.dataDisposable.dispose();
      this.dataDisposable = null;
    }
    if (this.exitDisposable) {
      this.exitDisposable.dispose();
      this.exitDisposable = null;
    }
    // Kill the terminal
    this.term.kill();
  }
}

class TerminalManager {
    private terminals: Map<number, NodePtyTerminal> = new Map();
    private disposables: Map<number, (() => void)[]> = new Map();

    constructor() {
        console.log('[TerminalManager] Initializing terminal manager');
        console.log('[TerminalManager] Registering IPC listener on channel:', IPC_TERMINAL_CHANNEL);
        ipcMain.on(IPC_TERMINAL_CHANNEL, this.onMessage.bind(this));
        console.log('[TerminalManager] IPC listener registered successfully');
    }

    private onMessage(event: Electron.IpcMainEvent, { type, payload, pid, shell, cwd }: { type: string, payload?: any, pid: number, shell?: string, cwd?: string }) {
        console.log('[TerminalManager] Received IPC message:', { type, pid, payloadLength: payload?.length });
        
        switch (type) {
            case 'create':
                console.log('[TerminalManager] Creating terminal with pid:', pid);
                this.create(pid, shell, cwd, event.sender);
                break;
            case 'data':
                console.log('[TerminalManager] Writing data to terminal:', pid, 'data:', payload);
                this.terminals.get(pid)?.write(payload);
                break;
            case 'resize':
                console.log('[TerminalManager] Resizing terminal:', pid, payload);
                this.terminals.get(pid)?.resize(payload.cols, payload.rows);
                break;
            case 'close':
                console.log('[TerminalManager] Closing terminal:', pid);
                this.close(pid);
                break;
            default:
                console.warn('[TerminalManager] Unknown message type:', type);
        }
    }

    private create(pid: number, shell: string | undefined, cwd: string | undefined, sender: Electron.WebContents) {
        const defaultShell = process.platform === 'win32'
          ? process.env.COMSPEC || 'cmd.exe'
          : shell || process.env.SHELL || 'bash';

        console.log('[TerminalManager] Spawning PTY:', { pid, shell: defaultShell, cwd });

        const term = new NodePtyTerminal(defaultShell, cwd);
        this.terminals.set(pid, term as any);
        console.log('[TerminalManager] Terminal created and stored in map. Total terminals:', this.terminals.size);

        const disposables: (() => void)[] = [];

        term.onData((data: string) => {
            console.log('[TerminalManager] Terminal data callback triggered for pid:', pid, 'data:', data.substring(0, 80));
            try {
                if (!sender.isDestroyed()) {
                    console.log('[TerminalManager] Sending data to renderer via IPC');
                    sender.send(IPC_TERMINAL_CHANNEL, { type: 'data', data, pid });
                } else {
                    console.warn('[TerminalManager] Sender is destroyed, cannot send data');
                }
            } catch (error) {
                console.error('[TerminalManager] Error sending terminal data:', error);
                this.close(pid);
            }
        });

        term.onExit(() => {
            console.log('[TerminalManager] Terminal exit callback triggered for pid:', pid);
            try {
                if (!sender.isDestroyed()) {
                    console.log('[TerminalManager] Sending exit event to renderer');
                    sender.send(IPC_TERMINAL_CHANNEL, { type: 'exit', pid });
                } else {
                    console.warn('[TerminalManager] Sender is destroyed, cannot send exit');
                }
            } catch (error) {
                console.error('[TerminalManager] Error sending terminal exit:', error);
            }
            this.close(pid);
        });

        this.disposables.set(pid, disposables);
        console.log('[TerminalManager] Terminal setup complete for pid:', pid);
    }

    private close(pid: number) {
        console.log('[TerminalManager] Closing terminal:', pid);
        const terminal = this.terminals.get(pid);
        if (terminal) {
            console.log('[TerminalManager] Killing terminal process');
            terminal.kill();
            this.terminals.delete(pid);
        } else {
            console.warn('[TerminalManager] Terminal not found:', pid);
        }
        
        const disposables = this.disposables.get(pid);
        if (disposables) {
            console.log('[TerminalManager] Cleaning up disposables:', disposables.length);
            disposables.forEach(dispose => dispose());
            this.disposables.delete(pid);
        }
        
        console.log('[TerminalManager] Terminal closed. Remaining terminals:', this.terminals.size);
    }
}

export function initTerminalManager(): void {
    console.log('[TerminalManager] initTerminalManager called');
    new TerminalManager();
    console.log('[TerminalManager] Terminal manager initialized');
} 