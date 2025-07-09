/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Controller } from '@/controllers/controller';
import { IpcGetPopupDomainsArgs, IpcGetPopupDomainsRes, ipcGetPopupDomainsChannel } from '@common/ipc/channels';

// Default patterns that should open in popups
const DEFAULT_POPUP_PATTERNS: IpcGetPopupDomainsRes = [
  { pattern: '^https?:\\/\\/accounts\\.google\\.com\\/signin\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.auth0\\.com\\/authorize', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/github\\.com\\/login\\/device', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\/auth\\/.*\\/callback', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/localhost.*\\/callback', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/127\\.0\\.0\\.1.*\\/callback', isRegex: true, enabled: true },
  { pattern: 'popup=true', isRegex: false, enabled: true },
  { pattern: 'dialog=true', isRegex: false, enabled: true },
  { pattern: '_popup=true', isRegex: false, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.slack\\.com\\/.*\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.zoom\\.us\\/.*\\/oauth', isRegex: true, enabled: true },
  { pattern: '^https?:\\/\\/.*\\.dropbox\\.com\\/oauth', isRegex: true, enabled: true },
];

// Store the current popup domains configuration
let cachedPopupDomains: IpcGetPopupDomainsRes = DEFAULT_POPUP_PATTERNS;

export function createAppConfigControllers(): Controller<IpcGetPopupDomainsArgs, IpcGetPopupDomainsRes>[] {
  return [{
    channel: ipcGetPopupDomainsChannel,
    handle: async () => {
      // For now, return the defaults - we can enhance this later to sync with renderer
      return cachedPopupDomains;
    }
  }];
}

export function getPopupDomains(): IpcGetPopupDomainsRes {
  return cachedPopupDomains;
}

export function updatePopupDomains(domains: IpcGetPopupDomainsRes): void {
  cachedPopupDomains = domains;
} 