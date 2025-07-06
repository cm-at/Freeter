/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { BrowserWindow } from '@/application/interfaces/browserWindow';

export interface OpenNewWindowDeps {
  createNewWindow: () => Promise<BrowserWindow>;
}

export function createOpenNewWindowUseCase(deps: OpenNewWindowDeps) {
  const { createNewWindow } = deps;
  
  return async function openNewWindowUseCase(): Promise<void> {
    const newWindow = await createNewWindow();
    if (newWindow) {
      newWindow.show();
    }
  };
}

export type OpenNewWindowUseCase = ReturnType<typeof createOpenNewWindowUseCase>; 