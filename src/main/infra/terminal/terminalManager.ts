import { ipcMain } from 'electron';
import { IPC_TERMINAL_CHANNEL } from '../../../common/ipc/channels';

// Mock IPty interface for now
interface MockIPty {
    pid: number;
    onData: (callback: (data: string) => void) => void;
    onExit: (callback: () => void) => void;
    write: (data: string) => void;
    resize: (cols: number, rows: number) => void;
    kill: () => void;
}

class MockTerminal implements MockIPty {
    pid: number;
    private dataCallbacks: ((data: string) => void)[] = [];
    private exitCallbacks: (() => void)[] = [];

    constructor(pid: number) {
        this.pid = pid;
        console.log(`[MockTerminal] Creating mock terminal with pid: ${pid}`);
        // Simulate a simple echo terminal
        setTimeout(() => {
            console.log(`[MockTerminal] Sending initial prompt for pid: ${pid}`);
            const initialPrompt = 'Mock Terminal Ready\r\n$ ';
            console.log(`[MockTerminal] Data callbacks count: ${this.dataCallbacks.length}`);
            this.dataCallbacks.forEach(cb => {
                console.log(`[MockTerminal] Calling data callback with initial prompt`);
                cb(initialPrompt);
            });
        }, 100);
    }

    onData(callback: (data: string) => void): void {
        console.log(`[MockTerminal] Registering onData callback for pid: ${this.pid}`);
        this.dataCallbacks.push(callback);
        console.log(`[MockTerminal] Total data callbacks: ${this.dataCallbacks.length}`);
    }

    onExit(callback: () => void): void {
        console.log(`[MockTerminal] Registering onExit callback for pid: ${this.pid}`);
        this.exitCallbacks.push(callback);
    }

    write(data: string): void {
        console.log(`[MockTerminal] Write called for pid: ${this.pid}, data: "${data}", data length: ${data.length}`);
        // Echo back the input
        this.dataCallbacks.forEach((cb, index) => {
            console.log(`[MockTerminal] Calling data callback ${index} with echo`);
            cb(data);
        });
        if (data === '\r') {
            console.log(`[MockTerminal] Detected carriage return, sending new prompt`);
            this.dataCallbacks.forEach(cb => cb('\r\n$ '));
        }
    }

    resize(cols: number, rows: number): void {
        console.log(`[MockTerminal] Terminal ${this.pid} resized to ${cols}x${rows}`);
    }

    kill(): void {
        console.log(`[MockTerminal] Kill called for pid: ${this.pid}`);
        this.exitCallbacks.forEach((cb, index) => {
            console.log(`[MockTerminal] Calling exit callback ${index}`);
            cb();
        });
    }
}

class TerminalManager {
    private terminals: Map<number, MockTerminal> = new Map();
    private disposables: Map<number, (() => void)[]> = new Map();

    constructor() {
        console.log('[TerminalManager] Initializing terminal manager');
        console.log('[TerminalManager] Registering IPC listener on channel:', IPC_TERMINAL_CHANNEL);
        ipcMain.on(IPC_TERMINAL_CHANNEL, this.onMessage.bind(this));
        console.log('[TerminalManager] IPC listener registered successfully');
    }

    private onMessage(event: Electron.IpcMainEvent, { type, payload, pid }: { type: string, payload?: any, pid: number }) {
        console.log('[TerminalManager] Received IPC message:', { type, pid, payloadLength: payload?.length });
        
        switch (type) {
            case 'create':
                console.log('[TerminalManager] Creating terminal with pid:', pid);
                this.create(pid, event.sender);
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

    private create(pid: number, sender: Electron.WebContents) {
        console.log('[TerminalManager] Creating mock terminal instance for pid:', pid);
        const term = new MockTerminal(pid);
        this.terminals.set(pid, term);
        console.log('[TerminalManager] Terminal created and stored in map. Total terminals:', this.terminals.size);

        const disposables: (() => void)[] = [];

        term.onData((data: string) => {
            console.log('[TerminalManager] Terminal data callback triggered for pid:', pid, 'data:', data);
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