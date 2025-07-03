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
  console.log('[TerminalProvider] Creating terminal provider');
  const dataCallbacks: Array<(pid: number, data: string) => void> = [];
  const exitCallbacks: Array<(pid: number) => void> = [];

  // Listen for terminal messages (preload strips the `event` arg so the first arg IS the message)
  console.log('[TerminalProvider] Setting up IPC listener for channel:', IPC_TERMINAL_CHANNEL);
  electronIpcRenderer.on(IPC_TERMINAL_CHANNEL, (message: any) => {
    console.log('[TerminalProvider] Received IPC message:', message);
    if (message?.type === 'data') {
      console.log('[TerminalProvider] Processing data message for pid:', message.pid, 'data:', message.data);
      console.log('[TerminalProvider] Data callbacks count:', dataCallbacks.length);
      dataCallbacks.forEach((cb, index) => {
        console.log(`[TerminalProvider] Calling data callback ${index}`);
        cb(message.pid, message.data);
      });
    } else if (message?.type === 'exit') {
      console.log('[TerminalProvider] Processing exit message for pid:', message.pid);
      exitCallbacks.forEach((cb, index) => {
        console.log(`[TerminalProvider] Calling exit callback ${index}`);
        cb(message.pid);
      });
    } else {
      console.warn('[TerminalProvider] Unknown or malformed message:', message);
    }
  });

  const provider: TerminalProvider = {
    execCmdLines: async (cmdLines: ReadonlyArray<string>, cwd?: string): Promise<void> => {
      console.log('[TerminalProvider] execCmdLines called:', { cmdLines, cwd });
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
      console.log('[TerminalProvider] createTerminal called:', { widgetId, shell, cwd });
      const result = await electronIpcRenderer.invoke<IpcTerminalCreateArgs, IpcTerminalCreateRes>(
        ipcTerminalCreateChannel,
        widgetId,
        shell,
        cwd,
      );
      console.log('[TerminalProvider] createTerminal result:', result);
      return result;
    },

    writeToTerminal: async (ptyId: number, data: string): Promise<void> => {
      console.log('[TerminalProvider] writeToTerminal called:', { ptyId, data });
      await electronIpcRenderer.invoke<IpcTerminalWriteArgs, IpcTerminalWriteRes>(
        ipcTerminalWriteChannel,
        ptyId,
        data,
      );
    },

    closeTerminal: async (ptyId: number): Promise<void> => {
      console.log('[TerminalProvider] closeTerminal called:', { ptyId });
      await electronIpcRenderer.invoke<IpcTerminalCloseArgs, IpcTerminalCloseRes>(
        ipcTerminalCloseChannel,
        ptyId,
      );
    },

    onTerminalData: (callback: (pid: number, data: string) => void): void => {
      console.log('[TerminalProvider] onTerminalData callback registered');
      dataCallbacks.push(callback);
      console.log('[TerminalProvider] Total data callbacks:', dataCallbacks.length);
    },

    onTerminalExit: (callback: (pid: number) => void): void => {
      console.log('[TerminalProvider] onTerminalExit callback registered');
      exitCallbacks.push(callback);
      console.log('[TerminalProvider] Total exit callbacks:', exitCallbacks.length);
    },
  };

  console.log('[TerminalProvider] Terminal provider created');
  return provider;
}