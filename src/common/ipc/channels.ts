/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { MenuItemsIpc } from '@common/base/menu';
import { ProcessInfo } from '@common/base/process';
import { makeIpcChannelName } from '@common/ipc/ipc';
import { MessageBoxConfig, MessageBoxResult, OpenDialogResult, OpenDirDialogConfig, OpenFileDialogConfig, SaveDialogResult, SaveFileDialogConfig } from '@common/base/dialog';

export const ipcAppDataStorageGetTextChannel = makeIpcChannelName('app-data-storage-get-text');
export type IpcAppDataStorageGetTextArgs = [key: string];
export type IpcAppDataStorageGetTextRes = string | undefined;

export const ipcAppDataStorageSetTextChannel = makeIpcChannelName('app-data-storage-set-text');
export type IpcAppDataStorageSetTextArgs = [key: string, text: string];
export type IpcAppDataStorageSetTextRes = void;

export const ipcAppDataStorageDeleteChannel = makeIpcChannelName('app-data-storage-delete');
export type IpcAppDataStorageDeleteArgs = [key: string];
export type IpcAppDataStorageDeleteRes = void;

export const ipcAppDataStorageClearChannel = makeIpcChannelName('app-data-storage-clear');
export type IpcAppDataStorageClearArgs = [];
export type IpcAppDataStorageClearRes = void;

export const ipcAppDataStorageGetKeysChannel = makeIpcChannelName('app-data-storage-get-keys');
export type IpcAppDataStorageGetKeysArgs = [];
export type IpcAppDataStorageGetKeysRes = string[];

export const ipcWidgetDataStorageGetTextChannel = makeIpcChannelName('widget-data-storage-get-text');
export type IpcWidgetDataStorageGetTextArgs = [widgetId: string, key: string];
export type IpcWidgetDataStorageGetTextRes = string | undefined;

export const ipcWidgetDataStorageSetTextChannel = makeIpcChannelName('widget-data-storage-set-text');
export type IpcWidgetDataStorageSetTextArgs = [widgetId: string, key: string, text: string];
export type IpcWidgetDataStorageSetTextRes = void;

export const ipcWidgetDataStorageDeleteChannel = makeIpcChannelName('widget-data-storage-delete');
export type IpcWidgetDataStorageDeleteArgs = [widgetId: string, key: string];
export type IpcWidgetDataStorageDeleteRes = void;

export const ipcWidgetDataStorageClearChannel = makeIpcChannelName('widget-data-storage-clear');
export type IpcWidgetDataStorageClearArgs = [widgetId: string];
export type IpcWidgetDataStorageClearRes = void;

export const ipcWidgetDataStorageGetKeysChannel = makeIpcChannelName('widget-data-storage-get-keys');
export type IpcWidgetDataStorageGetKeysArgs = [widgetId: string];
export type IpcWidgetDataStorageGetKeysRes = string[];

export const ipcCopyWidgetDataStorageChannel = makeIpcChannelName('copt-widget-data-storage');
export type IpcCopyWidgetDataStorageArgs = [srcWidgetId: string, toWidgetId: string];
export type IpcCopyWidgetDataStorageRes = boolean;

export const ipcPopupOsContextMenuChannel = makeIpcChannelName('popup-os-context-menu');
export type IpcPopupOsContextMenuArgs = [menuItems: MenuItemsIpc];
export type IpcPopupOsContextMenuRes = number | undefined;

export const ipcShellOpenAppChannel = makeIpcChannelName('shell-open-app');
export type IpcShellOpenAppArgs = [appPath: string, args?: string[]];
export type IpcShellOpenAppRes = void;

export const ipcShellOpenExternalUrlChannel = makeIpcChannelName('shell-open-external-url');
export type IpcShellOpenExternalUrlArgs = [url: string];
export type IpcShellOpenExternalUrlRes = void;

export const ipcShellOpenPathChannel = makeIpcChannelName('shell-open-path');
export type IpcShellOpenPathArgs = [path: string];
export type IpcShellOpenPathRes = string;

export const ipcWriteBookmarkIntoClipboardChannel = makeIpcChannelName('write-bookmark-into-clipboard');
export type IpcWriteBookmarkIntoClipboardArgs = [title: string, url: string];
export type IpcWriteBookmarkIntoClipboardRes = void;

export const ipcWriteTextIntoClipboardChannel = makeIpcChannelName('write-text-into-clipboard');
export type IpcWriteTextIntoClipboardArgs = [text: string];
export type IpcWriteTextIntoClipboardRes = void;

export const ipcGetProcessInfoChannel = makeIpcChannelName('get-process-info');
export type IpcGetProcessInfoArgs = [];
export type IpcGetProcessInfoRes = ProcessInfo;

export const ipcShowOsMessageBoxChannel = makeIpcChannelName('show-os-message-box');
export type IpcShowOsMessageBoxArgs = [config: MessageBoxConfig];
export type IpcShowOsMessageBoxRes = MessageBoxResult;

export const ipcShowOsOpenFileDialogChannel = makeIpcChannelName('show-os-open-file-dialog');
export type IpcShowOsOpenFileDialogArgs = [config: OpenFileDialogConfig];
export type IpcShowOsOpenFileDialogRes = OpenDialogResult;

export const ipcShowOsSaveFileDialogChannel = makeIpcChannelName('show-os-save-file-dialog');
export type IpcShowOsSaveFileDialogArgs = [config: SaveFileDialogConfig];
export type IpcShowOsSaveFileDialogRes = SaveDialogResult;

export const ipcShowOsOpenDirDialogChannel = makeIpcChannelName('show-os-open-dir-dialog');
export type IpcShowOsOpenDirDialogArgs = [config: OpenDirDialogConfig];
export type IpcShowOsOpenDirDialogRes = OpenDialogResult;

export const ipcSetAppMenuChannel = makeIpcChannelName('set-app-menu');
export type IpcSetAppMenuArgs = [menuItems: MenuItemsIpc];
export type IpcSetAppMenuRes = void;


export const ipcSetAppMenuAutoHideChannel = makeIpcChannelName('set-app-menu-auto-hide');
export type IpcSetAppMenuAutoHideArgs = [autoHide: boolean];
export type IpcSetAppMenuAutoHideRes = void;

export const ipcClickAppMenuActionChannel = makeIpcChannelName('click-app-menu-action');
export type IpcClickAppMenuActionArgs = [actionId: number];

export const ipcSetMainShortcutChannel = makeIpcChannelName('set-main-shortcut');
export type IpcSetMainShortcutArgs = [accelerator: string];
export type IpcSetMainShortcutRes = boolean;

export const ipcSetTrayMenuChannel = makeIpcChannelName('set-tray-menu');
export type IpcSetTrayMenuArgs = [menuItems: MenuItemsIpc];
export type IpcSetTrayMenuRes = void;

export const ipcClickTrayMenuActionChannel = makeIpcChannelName('click-tray-menu-action');
export type IpcClickTrayMenuActionArgs = [actionId: number];

export const ipcShowBrowserWindowChannel = makeIpcChannelName('show-browser-window');
export type IpcShowBrowserWindowArgs = [];
export type IpcShowBrowserWindowRes = void;

export const ipcOpenNewWindowChannel = makeIpcChannelName('open-new-window');
export type IpcOpenNewWindowArgs = [];
export type IpcOpenNewWindowRes = void;

export const ipcReloadWindowChannel = makeIpcChannelName('reload-window');
export type IpcReloadWindowArgs = [];
export type IpcReloadWindowRes = void;

export const ipcStateSyncChannel = makeIpcChannelName('state-sync');
export type IpcStateSyncArgs = {
  type: 'entities-update' | 'widget-data-update' | 'app-config-update';
  payload: {
    projects?: any;
    workflows?: any;
    widgets?: any;
    apps?: any;
    widgetId?: string;
    widgetData?: any;
    appConfig?: any;
  };
  sourceWindowId: number;
  timestamp: number;
};
export type IpcStateSyncRes = void;

export const ipcGetPopupDomainsChannel = makeIpcChannelName('get-popup-domains');
export type IpcGetPopupDomainsArgs = [];
export type IpcGetPopupDomainsRes = { pattern: string; isRegex: boolean; enabled: boolean; }[];

export const ipcExecCmdLinesInTerminalChannel = makeIpcChannelName('exec-cmd-lines-in-terminal');
export type IpcExecCmdLinesInTerminalArgs = [cmdLines: ReadonlyArray<string>, cwd?: string];
export type IpcExecCmdLinesInTerminalRes = void;

export const ipcTerminalCreateChannel = makeIpcChannelName('terminal-create');
export type IpcTerminalCreateArgs = [widgetId: string, shell: string | undefined, cwd: string | undefined];
export type IpcTerminalCreateRes = { ptyId: number };

export const ipcTerminalWriteChannel = makeIpcChannelName('terminal-write');
export type IpcTerminalWriteArgs = [ptyId: number, data: string];
export type IpcTerminalWriteRes = void;

export const ipcTerminalCloseChannel = makeIpcChannelName('terminal-close');
export type IpcTerminalCloseArgs = [ptyId: number];
export type IpcTerminalCloseRes = void;

export const ipcTerminalOnDataChannel = makeIpcChannelName('terminal-on-data');
export type IpcTerminalOnDataArgs = [ptyId: number, data: string];

export const IPC_TERMINAL_CHANNEL = makeIpcChannelName('terminal-channel');
