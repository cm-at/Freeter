/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcMain } from 'electron';
import { IPC_TERMINAL_CHANNEL } from '../../../common/ipc/channels';
import os from 'os';
import * as pty from 'node-pty';
import { execSync } from 'child_process';

/**
 * Get the user's shell environment variables
 */
function getShellEnv(): NodeJS.ProcessEnv {
  try {
    // Get the user's default shell
    const userShell = process.env.SHELL || '/bin/zsh';
    
    // Execute a login shell to get the full environment
    const envOutput = execSync(`${userShell} -l -c 'env'`, {
      encoding: 'utf8',
      timeout: 5000
    });
    
    const env: NodeJS.ProcessEnv = {};
    
    // Parse the environment output
    envOutput.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key] = valueParts.join('=');
      }
    });
    
    // Merge with current process env, but prefer shell env for PATH
    return {
      ...process.env,
      ...env,
      // Ensure PATH from shell takes precedence
      PATH: env.PATH || process.env.PATH,
      // Ensure LANG is set for proper unicode support
      LANG: env.LANG || process.env.LANG || 'en_US.UTF-8'
    };
  } catch (error) {
    console.error('[TerminalManager] Failed to get shell environment:', error);
    // Fallback to process env with common paths added
    const commonPaths = [
      '/usr/local/bin',
      '/opt/homebrew/bin',
      '/opt/homebrew/sbin',
      process.env.PATH
    ].filter(Boolean).join(':');
    
    return {
      ...process.env,
      PATH: commonPaths,
      LANG: process.env.LANG || 'en_US.UTF-8'
    };
  }
}

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
    
    // Get the full shell environment
    const shellEnv = getShellEnv();
    
    this.term = pty.spawn(shell, [], {
      cols,
      rows,
      cwd: cwd || os.homedir(),
      env: shellEnv as { [key: string]: string },
    });
    this.pid = this.term.pid;
  }

  onData(callback: (data: string) => void): void {
    // Dispose of previous listener if it exists
    if (this.dataDisposable) {
      this.dataDisposable.dispose();
    }
    this.dataDisposable = this.term.onData(callback);
  }

  onExit(callback: () => void): void {
    // Dispose of previous listener if it exists
    if (this.exitDisposable) {
      this.exitDisposable.dispose();
    }
    this.exitDisposable = this.term.onExit(() => callback());
  }

  write(data: string): void {
    this.term.write(data);
  }

  resize(cols: number, rows: number): void {
    this.term.resize(cols, rows);
  }

  kill(): void {
    // Clean up event listeners
    if (this.dataDisposable) {
      this.dataDisposable.dispose();
      this.dataDisposable = null;
    }
    if (this.exitDisposable) {
      this.exitDisposable.dispose();
      this.exitDisposable = null;
    }
    this.term.kill();
  }
}

export class TerminalManager {
  private terminals: Map<number, NodePtyTerminal> = new Map();
  private nextId = 1;

  constructor() {
    console.log('[TerminalManager] Initializing TerminalManager');
  }

  createTerminal(shell?: string, cwd?: string): number {
    const id = this.nextId++;
    const defaultShell = process.platform === 'win32' ? 'cmd.exe' : (process.env.SHELL || '/bin/bash');
    const terminalShell = shell || defaultShell;
    
    console.log(`[TerminalManager] Creating terminal ${id} with shell: ${terminalShell}`);
    const terminal = new NodePtyTerminal(terminalShell, cwd);
    
    terminal.onData((data) => {
      console.log(`[TerminalManager] Terminal ${id} data:`, data);
      // Send data to all renderer windows
      ipcMain.emit(IPC_TERMINAL_CHANNEL, {
        type: 'data',
        pid: terminal.pid,
        data: data
      });
    });

    terminal.onExit(() => {
      console.log(`[TerminalManager] Terminal ${id} exited`);
      this.terminals.delete(id);
      // Send exit event to all renderer windows
      ipcMain.emit(IPC_TERMINAL_CHANNEL, {
        type: 'exit',
        pid: terminal.pid
      });
    });

    this.terminals.set(id, terminal);
    return terminal.pid;
  }

  writeToTerminal(ptyId: number, data: string): void {
    console.log(`[TerminalManager] Writing to terminal ${ptyId}:`, data);
    // Find terminal by pid
    for (const [id, terminal] of this.terminals) {
      if (terminal.pid === ptyId) {
        terminal.write(data);
        return;
      }
    }
    console.warn(`[TerminalManager] Terminal with ptyId ${ptyId} not found`);
  }

  closeTerminal(ptyId: number): void {
    console.log(`[TerminalManager] Closing terminal ${ptyId}`);
    // Find terminal by pid
    for (const [id, terminal] of this.terminals) {
      if (terminal.pid === ptyId) {
        terminal.kill();
        this.terminals.delete(id);
        return;
      }
    }
    console.warn(`[TerminalManager] Terminal with ptyId ${ptyId} not found`);
  }
} 