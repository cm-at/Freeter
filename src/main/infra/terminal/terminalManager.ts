/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ipcMain } from 'electron';
import { IPC_TERMINAL_CHANNEL } from '../../../common/ipc/channels';
import os from 'os';
import * as pty from 'node-pty';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get the user's shell environment variables
 */
function getShellEnv(): NodeJS.ProcessEnv {
  try {
    // Get the user's default shell
    const userShell = process.env.SHELL || '/bin/zsh';
    
    // Skip shell environment loading on macOS when running in development
    // to avoid potential issues with shell initialization
    if (process.platform === 'darwin' && process.env.NODE_ENV === 'development') {
      console.log('[TerminalManager] Skipping shell env loading in development mode');
      
      // Build a basic environment with common paths
      const pathComponents = [
        '/usr/local/bin',
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin',
        '/usr/bin',
        '/bin',
        '/usr/sbin',
        '/sbin',
        process.env.PATH
      ].filter(Boolean);
      
      const uniquePaths = [...new Set(pathComponents)];
      
      return {
        ...process.env,
        PATH: uniquePaths.join(':'),
        TERM: 'xterm-256color',
        LANG: process.env.LANG || 'en_US.UTF-8',
        // Remove PREFIX which can conflict with nvm
        PREFIX: undefined
      } as NodeJS.ProcessEnv;
    }
    
    // Execute a login shell to get the full environment
    const envOutput = execSync(`${userShell} -l -i -c 'env'`, {
      encoding: 'utf8',
      timeout: 5000,
      // Suppress stderr to avoid noise from shell initialization
      stdio: ['ignore', 'pipe', 'ignore']
    });
    
    const env: NodeJS.ProcessEnv = {};
    
    // Parse the environment output
    envOutput.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key] = valueParts.join('=');
      }
    });
    
    // Remove PREFIX which conflicts with nvm
    delete env.PREFIX;
    
    // Merge with current process env, but prefer shell env for PATH
    const mergedEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...env,
      // Ensure PATH from shell takes precedence
      PATH: env.PATH || process.env.PATH,
      // Ensure proper terminal type
      TERM: 'xterm-256color',
      // Ensure LANG is set for proper unicode support
      LANG: env.LANG || process.env.LANG || 'en_US.UTF-8'
    };
    
    // Remove PREFIX from merged environment if it exists
    if ('PREFIX' in mergedEnv) {
      delete mergedEnv.PREFIX;
    }
    
    return mergedEnv;
  } catch (error) {
    console.error('[TerminalManager] Failed to get shell environment:', error);
    // Fallback to process env with common paths added
    const commonPaths = [
      '/usr/local/bin',
      '/opt/homebrew/bin', 
      '/opt/homebrew/sbin',
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin',
      process.env.PATH
    ].filter(Boolean);
    
    const uniquePaths = [...new Set(commonPaths)];
    
    // Remove PREFIX in fallback too
    const fallbackEnv = { ...process.env };
    delete fallbackEnv.PREFIX;
    
    return {
      ...fallbackEnv,
      PATH: uniquePaths.join(':'),
      TERM: 'xterm-256color',
      LANG: process.env.LANG || 'en_US.UTF-8'
    } as NodeJS.ProcessEnv;
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
    
    // Validate and normalize the cwd
    let normalizedCwd = cwd || os.homedir();
    
    try {
      // Resolve the path to handle any inconsistencies
      if (cwd) {
        normalizedCwd = path.resolve(cwd);
        
        // Check if the directory exists
        if (!fs.existsSync(normalizedCwd)) {
          console.warn(`[NodePtyTerminal] Directory does not exist: ${normalizedCwd}, falling back to home directory`);
          normalizedCwd = os.homedir();
        } else {
          // Get the real path to handle case sensitivity issues on macOS
          normalizedCwd = fs.realpathSync(normalizedCwd);
        }
      }
    } catch (error) {
      console.error(`[NodePtyTerminal] Error validating cwd: ${error}, falling back to home directory`);
      normalizedCwd = os.homedir();
    }
    
    console.log(`[NodePtyTerminal] Creating real terminal with shell: ${shell}, cwd: ${normalizedCwd}`);
    
    // Get the full shell environment
    const shellEnv = getShellEnv();
    
    try {
      this.term = pty.spawn(shell, [], {
        cols,
        rows,
        cwd: normalizedCwd,
        env: shellEnv as { [key: string]: string },
      });
      this.pid = this.term.pid;
    } catch (error) {
      console.error(`[NodePtyTerminal] Failed to spawn terminal: ${error}`);
      // Try again with default shell and home directory
      this.term = pty.spawn(process.env.SHELL || '/bin/bash', [], {
        cols,
        rows,
        cwd: os.homedir(),
        env: shellEnv as { [key: string]: string },
      });
      this.pid = this.term.pid;
    }
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
    
    // Validate shell path
    let terminalShell = shell || defaultShell;
    
    // If shell is empty or just whitespace, use default
    if (!terminalShell || !terminalShell.trim()) {
      terminalShell = defaultShell;
    }
    
    // Check if shell exists (for absolute paths)
    if (terminalShell.startsWith('/') && !fs.existsSync(terminalShell)) {
      console.warn(`[TerminalManager] Shell not found: ${terminalShell}, falling back to default`);
      terminalShell = defaultShell;
    }
    
    console.log(`[TerminalManager] Creating terminal ${id} with shell: ${terminalShell}`);
    
    try {
      const terminal = new NodePtyTerminal(terminalShell, cwd);

      terminal.onData((data) => {
        // console.log(`[TerminalManager] Terminal ${id} data:`, data);
        // Send data to all renderer windows via IPC event
        // The terminal controller will forward this to renderer windows
        process.nextTick(() => {
          ipcMain.emit(IPC_TERMINAL_CHANNEL, null, {
            type: 'data',
            pid: terminal.pid,
            data: data
          });
        });
      });

      terminal.onExit(() => {
        console.log(`[TerminalManager] Terminal ${id} exited`);
        this.terminals.delete(id);
        // Send exit event to all renderer windows via IPC event
        process.nextTick(() => {
          ipcMain.emit(IPC_TERMINAL_CHANNEL, null, {
            type: 'exit',
            pid: terminal.pid
          });
        });
      });

      this.terminals.set(id, terminal);
      return terminal.pid;
    } catch (error) {
      console.error(`[TerminalManager] Failed to create terminal: ${error}`);
      // Return a negative ID to indicate failure
      return -1;
    }
  }

  writeToTerminal(ptyId: number, data: string): void {
    console.log(`[TerminalManager] Writing to terminal ${ptyId}, length: ${data.length}`);
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