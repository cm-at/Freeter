/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { 
  IpcExecCmdLinesInTerminalArgs, 
  IpcExecCmdLinesInTerminalRes, 
  ipcExecCmdLinesInTerminalChannel,
  IpcTerminalCreateArgs,
  IpcTerminalCreateRes,
  ipcTerminalCreateChannel,
  IpcTerminalWriteArgs,
  IpcTerminalWriteRes,
  ipcTerminalWriteChannel,
  IpcTerminalCloseArgs,
  IpcTerminalCloseRes,
  ipcTerminalCloseChannel,
  IPC_TERMINAL_CHANNEL
} from '@common/ipc/channels';
import { ExecCmdLinesInTerminalUseCase } from '@/application/useCases/terminal/execCmdLinesInTerminal';
import { ipcMain } from 'electron';

type Deps = {
  execCmdLinesInTerminalUseCase: ExecCmdLinesInTerminalUseCase;
}

// Store for active terminals
const terminals = new Map<number, any>();
let nextPtyId = 1;

export function createTerminalControllers({
  execCmdLinesInTerminalUseCase,
}: Deps): [
    Controller<IpcExecCmdLinesInTerminalArgs, IpcExecCmdLinesInTerminalRes>,
    Controller<IpcTerminalCreateArgs, IpcTerminalCreateRes>,
    Controller<IpcTerminalWriteArgs, IpcTerminalWriteRes>,
    Controller<IpcTerminalCloseArgs, IpcTerminalCloseRes>,
  ] {
  console.log('[TerminalControllers] Creating terminal controllers');
  
  return [{
    channel: ipcExecCmdLinesInTerminalChannel,
    handle: async (_, cmdLines, cwd) => {
      console.log('[TerminalControllers] execCmdLinesInTerminal called:', { cmdLines, cwd });
      execCmdLinesInTerminalUseCase(cmdLines, cwd);
    }
  }, {
    channel: ipcTerminalCreateChannel,
    handle: async (event, widgetId, shell, cwd) => {
      console.log('[TerminalControllers] Terminal create request:', { widgetId, shell, cwd });
      const ptyId = nextPtyId++;
      console.log('[TerminalControllers] Assigned ptyId:', ptyId);
      
      // Send create message to terminal manager
      console.log('[TerminalControllers] Emitting create event to terminal manager');
      ipcMain.emit(IPC_TERMINAL_CHANNEL, event, { type: 'create', pid: ptyId });
      
      console.log('[TerminalControllers] Returning ptyId to renderer:', { ptyId });
      return { ptyId };
    }
  }, {
    channel: ipcTerminalWriteChannel,
    handle: async (event, ptyId, data) => {
      console.log('[TerminalControllers] Terminal write request:', { ptyId, data: data.substring(0, 50) + '...' });
      // Send data to terminal manager
      ipcMain.emit(IPC_TERMINAL_CHANNEL, event, { type: 'data', payload: data, pid: ptyId });
    }
  }, {
    channel: ipcTerminalCloseChannel,
    handle: async (event, ptyId) => {
      console.log('[TerminalControllers] Terminal close request:', { ptyId });
      // Send close message to terminal manager
      ipcMain.emit(IPC_TERMINAL_CHANNEL, event, { type: 'close', pid: ptyId });
      terminals.delete(ptyId);
      console.log('[TerminalControllers] Terminal removed from map. Remaining:', terminals.size);
    }
  }]
}
