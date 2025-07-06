/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { BrowserWindowProvider } from '@/application/interfaces/browserWindowProvider';

interface Deps {
  browserWindow: BrowserWindowProvider;
}

export function createOpenNewWindowUseCase({ browserWindow }: Deps) {
  return async function openNewWindowUseCase(): Promise<void> {
    await browserWindow.openNewWindow();
  };
}

export type OpenNewWindowUseCase = ReturnType<typeof createOpenNewWindowUseCase>; 