/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import {
  IpcExecCmdLinesInTerminalArgs,
  IpcExecCmdLinesInTerminalRes,
  IpcTerminalCreateArgs,
  IpcTerminalCreateRes,
  IpcTerminalWriteArgs,
  IpcTerminalWriteRes,
  IpcTerminalCloseArgs,
  IpcTerminalCloseRes,
  ipcExecCmdLinesInTerminalChannel,
  ipcTerminalCreateChannel,
  ipcTerminalWriteChannel,
  ipcTerminalCloseChannel,
  IPC_TERMINAL_CHANNEL,
} from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { TerminalProvider } from '@/application/interfaces/terminalProvider';

export function createTerminalProvider(): TerminalProvider {
  const dataCallbacks: Set<(pid: number, data: string) => void> = new Set();
  const exitCallbacks: Set<(pid: number) => void> = new Set();

  // Listen for terminal messages (preload strips the `event` arg so the first arg IS the message)
  electronIpcRenderer.on(IPC_TERMINAL_CHANNEL, (message: any) => {
    if (message?.type === 'data') {
      dataCallbacks.forEach(cb => cb(message.pid, message.data));
    } else if (message?.type === 'exit') {
      exitCallbacks.forEach(cb => cb(message.pid));
    }
  });

  const provider: TerminalProvider = {
    execCmdLines: async (cmdLines: ReadonlyArray<string>, cwd?: string): Promise<void> => {
      await electronIpcRenderer.invoke<IpcExecCmdLinesInTerminalArgs, IpcExecCmdLinesInTerminalRes>(
        ipcExecCmdLinesInTerminalChannel,
        cmdLines,
        cwd,
      );
    },

    createTerminal: async (
      widgetId: string,
      shell?: string,
      cwd?: string,
    ): Promise<{ ptyId: number }> => {
      const result = await electronIpcRenderer.invoke<IpcTerminalCreateArgs, IpcTerminalCreateRes>(
        ipcTerminalCreateChannel,
        widgetId,
        shell,
        cwd,
      );
      return result;
    },

    writeToTerminal: async (ptyId: number, data: string): Promise<void> => {
      await electronIpcRenderer.invoke<IpcTerminalWriteArgs, IpcTerminalWriteRes>(
        ipcTerminalWriteChannel,
        ptyId,
        data,
      );
    },

    closeTerminal: async (ptyId: number): Promise<void> => {
      await electronIpcRenderer.invoke<IpcTerminalCloseArgs, IpcTerminalCloseRes>(
        ipcTerminalCloseChannel,
        ptyId,
      );
    },

    onTerminalData: (callback: (pid: number, data: string) => void): void => {
      dataCallbacks.add(callback);
    },

    onTerminalExit: (callback: (pid: number) => void): void => {
      exitCallbacks.add(callback);
    },
  };
  
  return provider;
}