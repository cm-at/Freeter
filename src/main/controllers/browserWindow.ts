/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcShowBrowserWindowArgs, ipcShowBrowserWindowChannel, IpcShowBrowserWindowRes, IpcOpenNewWindowArgs, ipcOpenNewWindowChannel, IpcOpenNewWindowRes } from '@common/ipc/channels';
import { ShowBrowserWindowUseCase } from '@/application/useCases/browserWindow/showBrowserWindow';
import { OpenNewWindowUseCase } from '@/application/useCases/browserWindow/openNewWindow';

type Deps = {
  showBrowserWindowUseCase: ShowBrowserWindowUseCase;
  openNewWindowUseCase?: OpenNewWindowUseCase;
}

export function createBrowserWindowControllers({
  showBrowserWindowUseCase,
  openNewWindowUseCase,
}: Deps): [
    Controller<IpcShowBrowserWindowArgs, IpcShowBrowserWindowRes>,
    ...Array<Controller<IpcOpenNewWindowArgs, IpcOpenNewWindowRes>>
  ] {
  const controllers: Array<Controller<any, any>> = [{
    channel: ipcShowBrowserWindowChannel,
    handle: async (event) => {
      const win = event.getSenderBrowserWindow();
      if (win) {
        showBrowserWindowUseCase(win);
      }
    }
  }];

  if (openNewWindowUseCase) {
    controllers.push({
      channel: ipcOpenNewWindowChannel,
      handle: async () => {
        await openNewWindowUseCase();
      }
    });
  }

  return controllers as any;
}
