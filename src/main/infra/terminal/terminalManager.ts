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
        // Simulate a simple echo terminal
        setTimeout(() => {
            this.dataCallbacks.forEach(cb => cb('Mock Terminal Ready\r\n$ '));
        }, 100);
    }

    onData(callback: (data: string) => void): void {
        this.dataCallbacks.push(callback);
    }

    onExit(callback: () => void): void {
        this.exitCallbacks.push(callback);
    }

    write(data: string): void {
        // Echo back the input
        this.dataCallbacks.forEach(cb => cb(data));
        if (data === '\r') {
            this.dataCallbacks.forEach(cb => cb('\r\n$ '));
        }
    }

    resize(cols: number, rows: number): void {
        console.log(`Terminal ${this.pid} resized to ${cols}x${rows}`);
    }

    kill(): void {
        this.exitCallbacks.forEach(cb => cb());
    }
}

class TerminalManager {
    private terminals: Map<number, MockTerminal> = new Map();
    private disposables: Map<number, (() => void)[]> = new Map();

    constructor() {
        ipcMain.on(IPC_TERMINAL_CHANNEL, this.onMessage.bind(this));
    }

    private onMessage(event: Electron.IpcMainEvent, { type, payload, pid }: { type: string, payload?: any, pid: number }) {
        switch (type) {
            case 'create':
                this.create(pid, event.sender);
                break;
            case 'data':
                this.terminals.get(pid)?.write(payload);
                break;
            case 'resize':
                this.terminals.get(pid)?.resize(payload.cols, payload.rows);
                break;
            case 'close':
                this.close(pid);
                break;
        }
    }

    private create(pid: number, sender: Electron.WebContents) {
        const term = new MockTerminal(pid);
        this.terminals.set(pid, term);

        const disposables: (() => void)[] = [];

        term.onData((data: string) => {
            try {
                if (!sender.isDestroyed()) {
                    sender.send(IPC_TERMINAL_CHANNEL, { type: 'data', data, pid });
                }
            } catch (error) {
                console.error('Error sending terminal data:', error);
                this.close(pid);
            }
        });

        term.onExit(() => {
            try {
                if (!sender.isDestroyed()) {
                    sender.send(IPC_TERMINAL_CHANNEL, { type: 'exit', pid });
                }
            } catch (error) {
                console.error('Error sending terminal exit:', error);
            }
            this.close(pid);
        });

        this.disposables.set(pid, disposables);
    }

    private close(pid: number) {
        this.terminals.get(pid)?.kill();
        this.terminals.delete(pid);
        
        const disposables = this.disposables.get(pid);
        disposables?.forEach(dispose => dispose());
        this.disposables.delete(pid);
    }
}

export function initTerminalManager(): void {
    new TerminalManager();
} 