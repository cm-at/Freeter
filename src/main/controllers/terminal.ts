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
import { TerminalManager } from '@/infra/terminal/terminalManager';
import { ipcMain, BrowserWindow } from 'electron';

type Deps = {
  execCmdLinesInTerminalUseCase: ExecCmdLinesInTerminalUseCase;
}

// Create a single terminal manager instance
const terminalManager = new TerminalManager();

// Set up IPC channel forwarding to renderer windows
ipcMain.on(IPC_TERMINAL_CHANNEL, (event: any, message: any) => {
  // Only log the message type, not the full data
  if (message && message.type) {
    console.log('[TerminalControllers] Forwarding terminal message:', { type: message.type, pid: message.pid });
  }
  // Forward to all windows
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_TERMINAL_CHANNEL, message);
    }
  });
});

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
      
      // Create terminal using the terminal manager
      const ptyId = terminalManager.createTerminal(shell, cwd);
      
      console.log('[TerminalControllers] Terminal created with ptyId:', ptyId);
      return { ptyId };
    }
  }, {
    channel: ipcTerminalWriteChannel,
    handle: async (event, ptyId, data) => {
      console.log('[TerminalControllers] Terminal write request:', { ptyId, dataLength: data.length });
      
      // Write to terminal using the terminal manager
      terminalManager.writeToTerminal(ptyId, data);
    }
  }, {
    channel: ipcTerminalCloseChannel,
    handle: async (event, ptyId) => {
      console.log('[TerminalControllers] Terminal close request:', { ptyId });
      
      // Close terminal using the terminal manager
      terminalManager.closeTerminal(ptyId);
      
      console.log('[TerminalControllers] Terminal closed');
    }
  }]
}
