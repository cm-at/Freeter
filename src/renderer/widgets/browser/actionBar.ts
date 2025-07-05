/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ActionBarItem, ActionBarItems } from '@/base/actionBar';
import { WidgetApi } from '@/base/widgetApi';
import { HistoryManager } from './historyManager';
import { backSvg, forwardSvg, homeSvg, reloadSvg, openInBrowserSvg } from './icons';

export function createActionBarItems(
  elWebview: Electron.WebviewTag | null,
  widgetApi: WidgetApi,
  homeUrl: string,
  historyManager: HistoryManager
): ActionBarItems {
  if (!elWebview) {
    return []
  }

  return [
    {
      enabled: elWebview.canGoBack(),
      icon: backSvg,
      id: 'BACK',
      title: 'Go Back',
      doAction: async () => elWebview.goBack()
    },
    {
      enabled: elWebview.canGoForward(),
      icon: forwardSvg,
      id: 'FORWARD',
      title: 'Go Forward',
      doAction: async () => elWebview.goForward()
    },
    {
      enabled: true,
      icon: reloadSvg,
      id: 'RELOAD',
      title: 'Reload',
      doAction: async () => {
        if (elWebview.isLoading()) {
          elWebview.stop();
        } else {
          elWebview.reload();
        }
      }
    },
    {
      enabled: homeUrl !== '',
      icon: homeSvg,
      id: 'HOME',
      title: 'Go Home',
      doAction: async () => {
        if (homeUrl) {
          elWebview.loadURL(homeUrl);
        }
      }
    },
    {
      enabled: true,
      icon: openInBrowserSvg,
      id: 'OPEN-IN-BROWSER',
      title: 'Open in Browser',
      doAction: async () => widgetApi.shell.openExternalUrl(elWebview.getURL())
    }
  ];
} 