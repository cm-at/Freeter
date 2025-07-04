/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface TerminalProvider {
  execCmdLines: (cmdLines: ReadonlyArray<string>, cwd?: string) => Promise<void>;
  createTerminal: (widgetId: string, shell?: string, cwd?: string) => Promise<{ ptyId: number }>;
  writeToTerminal: (ptyId: number, data: string) => Promise<void>;
  closeTerminal: (ptyId: number) => Promise<void>;
  onTerminalData: (callback: (pid: number, data: string) => void) => void;
  onTerminalExit: (callback: (pid: number) => void) => void;
}
