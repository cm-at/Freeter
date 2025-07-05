/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetApi, WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';
import { HistoryManager } from './historyManager';

export function createContextMenuFactory(
  elWebview: Electron.WebviewTag | null,
  widgetApi: WidgetApi,
  historyManager: HistoryManager
): WidgetContextMenuFactory {
  return (contextData?: unknown) => {
    const menuItems: WidgetMenuItem[] = [];

    if (elWebview) {
      // Navigation items
      menuItems.push({
        label: 'Back',
        enabled: elWebview.canGoBack(),
        doAction: async () => elWebview.goBack()
      });
      menuItems.push({
        label: 'Forward',
        enabled: elWebview.canGoForward(),
        doAction: async () => elWebview.goForward()
      });
      menuItems.push({
        label: 'Reload',
        doAction: async () => elWebview.reload()
      });
      menuItems.push({
        type: 'separator'
      });

      // Handle context data from webview (right-click on links, images, etc)
      if (contextData) {
        const params = contextData as any;
        
        if (params.linkURL) {
          menuItems.push({
            label: 'Open Link in New Tab',
            doAction: async () => {
              // This would need to be handled by the parent component
              // For now, open in external browser
              widgetApi.shell.openExternalUrl(params.linkURL);
            }
          });
          menuItems.push({
            label: 'Copy Link Address',
            doAction: async () => widgetApi.clipboard.writeText(params.linkURL)
          });
          menuItems.push({
            type: 'separator'
          });
        }

        if (params.srcURL && params.mediaType === 'image') {
          menuItems.push({
            label: 'Copy Image',
            doAction: async () => {
              // copyImageAt is not available on WebviewTag, so just copy the URL
              widgetApi.clipboard.writeText(params.srcURL);
            }
          });
          menuItems.push({
            label: 'Copy Image Address',
            doAction: async () => widgetApi.clipboard.writeText(params.srcURL)
          });
          menuItems.push({
            type: 'separator'
          });
        }

        if (params.isEditable) {
          menuItems.push({
            label: 'Undo',
            doAction: async () => elWebview.undo()
          });
          menuItems.push({
            label: 'Redo',
            doAction: async () => elWebview.redo()
          });
          menuItems.push({
            type: 'separator'
          });
          menuItems.push({
            label: 'Cut',
            doAction: async () => elWebview.cut()
          });
          menuItems.push({
            label: 'Copy',
            doAction: async () => elWebview.copy()
          });
          menuItems.push({
            label: 'Paste',
            doAction: async () => elWebview.paste()
          });
          menuItems.push({
            label: 'Select All',
            doAction: async () => elWebview.selectAll()
          });
          menuItems.push({
            type: 'separator'
          });
        } else if (params.selectionText) {
          menuItems.push({
            label: 'Copy',
            doAction: async () => elWebview.copy()
          });
          menuItems.push({
            type: 'separator'
          });
        }
      }

      // Page actions
      menuItems.push({
        label: 'Copy Current URL',
        doAction: async () => widgetApi.clipboard.writeText(elWebview.getURL())
      });
      menuItems.push({
        label: 'Open in Browser',
        doAction: async () => widgetApi.shell.openExternalUrl(elWebview.getURL())
      });
      menuItems.push({
        type: 'separator'
      });

      // History submenu
      const history = historyManager.getHistory();
      if (history.length > 0) {
        const historyItems = history.slice(0, 10).map(item => ({
          label: item.title || item.url,
          sublabel: item.url,
          doAction: async () => elWebview.loadURL(item.url)
        }));
        
        menuItems.push({
          label: 'Recent History',
          submenu: [
            ...historyItems,
            { type: 'separator' as const },
            {
              label: 'Clear History',
              doAction: async () => historyManager.clearHistory()
            }
          ]
        });
        menuItems.push({
          type: 'separator'
        });
      }

      // Developer tools
      menuItems.push({
        label: 'Developer Tools',
        doAction: async () => {
          if (elWebview.isDevToolsOpened()) {
            elWebview.closeDevTools();
          } else {
            elWebview.openDevTools();
          }
        }
      });
    }

    return menuItems;
  };
} 