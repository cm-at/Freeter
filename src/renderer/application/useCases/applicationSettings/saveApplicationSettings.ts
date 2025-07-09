/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AppStore } from '@/application/interfaces/store';
import { modalScreensStateActions } from '@/base/state/actions';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { IpcStateSyncArgs, IpcStateSyncRes, ipcStateSyncChannel } from '@common/ipc/channels';

type Deps = {
  appStore: AppStore;
}

export type SaveApplicationSettingsUseCase = () => void;

export function createSaveApplicationSettingsUseCase({
  appStore
}: Deps): SaveApplicationSettingsUseCase {
  return () => {
    const state = appStore.get();
    const { appConfig } = state.ui.modalScreens.data.applicationSettings;
    if (!appConfig) {
      return;
    }
    
    // Update the app config in state
    const newState = {
      ...state,
      ui: {
        ...state.ui,
        appConfig
      }
    };
    
    // Notify other windows about the app config update
    const syncArgs: IpcStateSyncArgs = {
      type: 'app-config-update',
      payload: {
        appConfig
      },
      sourceWindowId: Date.now(),
      timestamp: Date.now()
    };
    
    electronIpcRenderer.invoke<[IpcStateSyncArgs], IpcStateSyncRes>(ipcStateSyncChannel, syncArgs);
    
    // Close the modal and update state
    appStore.set(modalScreensStateActions.closeModalScreen(newState, 'applicationSettings'));
  }
}
