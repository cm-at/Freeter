/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcStateSyncArgs, ipcStateSyncChannel } from '@common/ipc/channels';
import { BrowserWindow as ElectronBrowserWindow, WebContents as ElectronWebContents } from 'electron';

type Deps = {
  getAllWindows: () => Map<number, ElectronBrowserWindow>;
}

export function createStateSyncControllers({
  getAllWindows
}: Deps): Controller<[IpcStateSyncArgs], void>[] {
  return [{
    channel: ipcStateSyncChannel,
    handle: async (event, args) => {
      const sourceWindow = ElectronBrowserWindow.fromWebContents(event.sender as unknown as ElectronWebContents);
      const allWindows = getAllWindows();
      
      // Broadcast the state change to all other windows
      for (const [windowId, window] of allWindows) {
        if (window !== sourceWindow && !window.isDestroyed()) {
          window.webContents.send(ipcStateSyncChannel, args);
        }
      }
    }
  }];
} 