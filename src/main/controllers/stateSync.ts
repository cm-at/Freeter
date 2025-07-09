/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcStateSyncArgs, ipcStateSyncChannel } from '@common/ipc/channels';
import { BrowserWindow } from 'electron';
import { updatePopupDomains } from './appConfig';

type Deps = {
  getAllWindows: () => Map<number, BrowserWindow>;
}

export function createStateSyncControllers({
  getAllWindows
}: Deps): Controller<[IpcStateSyncArgs], void>[] {
  return [{
    channel: ipcStateSyncChannel,
    handle: async (event, args) => {
      const sourceWindow = BrowserWindow.fromWebContents(event.sender as any);
      const allWindows = getAllWindows();
      
      // Handle app config updates
      if (args.type === 'app-config-update' && args.payload?.appConfig?.popupDomains) {
        updatePopupDomains(args.payload.appConfig.popupDomains);
      }
      
      // Broadcast the state change to all other windows
      for (const [windowId, window] of allWindows) {
        if (window !== sourceWindow && !window.isDestroyed()) {
          window.webContents.send(ipcStateSyncChannel, args);
        }
      }
    }
  }];
} 