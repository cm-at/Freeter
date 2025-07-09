/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcStateSyncArgs, ipcStateSyncChannel } from '@common/ipc/channels';
import { BrowserWindow } from '@/application/interfaces/browserWindow';
import { BrowserWindow as ElectronBrowserWindow } from 'electron';
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
      const sourceWindow = ElectronBrowserWindow.fromWebContents(event.sender as any);
      const allWindows = getAllWindows();
      
      // Handle app config updates
      if (args.type === 'app-config-update' && args.payload?.appConfig?.popupDomains) {
        updatePopupDomains(args.payload.appConfig.popupDomains);
      }
      
      // Broadcast the state change to all other windows
      for (const [, window] of allWindows) {
        // Cast to any to bypass TypeScript checking for Electron internals
        const electronWindow = window as any;
        if (electronWindow !== sourceWindow && !electronWindow.isDestroyed()) {
          electronWindow.webContents.send(ipcStateSyncChannel, args);
        }
      }
    }
  }];
} 