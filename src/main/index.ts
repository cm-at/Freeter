/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { join } from 'node:path';
import { hostFreeterApp, schemeFreeterFile } from '@common/infra/network';
import { channelPrefix } from '@common/ipc/ipc';
import { createIpcMain } from '@/infra/ipcMain/ipcMain';
import { app, session } from 'electron';
import { createRendererWindow } from '@/infra/browserWindow/browserWindow';
import { createIpcMainEventValidator } from '@/infra/ipcMain/ipcMainEventValidator';
import { registerAppFileProtocol } from '@/infra/protocolHandler/registerAppFileProtocol';
import { registerControllers } from '@/controllers/controller';
import { createAppDataStorageControllers } from '@/controllers/appDataStorage';
import { createGetTextFromAppDataStorageUseCase } from '@/application/useCases/appDataStorage/getTextFromAppDataStorage';
import { createSetTextInAppDataStorageUseCase } from '@/application/useCases/appDataStorage/setTextInAppDataStorage';
import { copyFileDataStorage, createFileDataStorage } from '@/infra/dataStorage/fileDataStorage';
import { createContextMenuControllers } from '@/controllers/contextMenu';
import { createPopupContextMenuUseCase } from '@/application/useCases/contextMenu/popupContextMenu';
import { createContextMenuProvider } from '@/infra/contextMenuProvider/contextMenuProvider';
import { createClipboardControllers } from '@/controllers/clipboard';
import { createShellControllers } from '@/controllers/shell';
import { createWriteTextIntoClipboardUseCase } from '@/application/useCases/clipboard/writeTextIntoClipboard';
import { createClipboardProvider } from '@/infra/clipboardProvider/clipboardProvider';
import { createOpenExternalUrlUseCase } from '@/application/useCases/shell/openExternalUrl';
import { createShellProvider } from '@/infra/shellProvider/shellProvider';
import { createProcessControllers } from '@/controllers/process';
import { createGetProcessInfoUseCase } from '@/application/useCases/process/getProcessInfo';
import { createProcessProvider } from '@/infra/processProvider/processProvider';
import { createWriteBookmarkIntoClipboardUseCase } from '@/application/useCases/clipboard/writeBookmarkIntoClipboard';
import { createObjectManager } from '@common/base/objectManager';
import { createGetTextFromWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/getTextFromWidgetDataStorage';
import { createSetTextInWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/setTextInWidgetDataStorage';
import { createWidgetDataStorageControllers } from '@/controllers/widgetDataStorage';
import { createDeleteInWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/deleteInWidgetDataStorage';
import { createClearWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/clearWidgetDataStorage';
import { createGetKeysFromWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/getKeysFromWidgetDataStorage';
import { createDialogControllers } from '@/controllers/dialog';
import { createShowMessageBoxUseCase } from '@/application/useCases/dialog/showMessageBox';
import { createDialogProvider } from '@/infra/dialogProvider/dialogProvider';
import { createAppMenuControllers } from '@/controllers/appMenu';
import { createAppMenuProvider } from '@/infra/appMenuProvider/appMenuProvider';
import { createSetAppMenuUseCase } from '@/application/useCases/appMenu/setAppMenu';
import { createSetAppMenuAutoHideUseCase } from '@/application/useCases/appMenu/setAppMenuAutoHide';
import { createWindowStore } from '@/data/windowStore';
import { createWindowStateStorage } from '@/data/windowStateStorage';
import { setTextOnlyIfChanged } from '@common/infra/dataStorage/setTextOnlyIfChanged';
import { withJson } from '@common/infra/dataStorage/withJson';
import { createGetWindowStateUseCase } from '@/application/useCases/browserWindow/getWindowState';
import { createSetWindowStateUseCase } from '@/application/useCases/browserWindow/setWindowState';
import { BrowserWindow } from '@/application/interfaces/browserWindow';
import { createGlobalShortcutControllers } from '@/controllers/globalShortcut';
import { createSetMainShortcutUseCase } from '@/application/useCases/globalShortcut/setMainShortcut';
import { createGlobalShortcutProvider } from '@/infra/globalShortcut/globalShortcutProvider';
import { createTrayProvider } from '@/infra/trayProvider/trayProvider';
import { createInitTrayUseCase } from '@/application/useCases/tray/initTray';
import { createSetTrayMenuUseCase } from '@/application/useCases/tray/setTrayMenu';
import { createTrayMenuControllers } from '@/controllers/trayMenu';
import { createBrowserWindowControllers } from '@/controllers/browserWindow';
import { createShowBrowserWindowUseCase } from '@/application/useCases/browserWindow/showBrowserWindow';
import { createOpenNewWindowUseCase } from '@/application/useCases/browserWindow/openNewWindow';
import { createShowOpenFileDialogUseCase } from '@/application/useCases/dialog/showOpenFileDialog';
import { createShowSaveFileDialogUseCase } from '@/application/useCases/dialog/showSaveFileDialog';
import { createShowOpenDirDialogUseCase } from '@/application/useCases/dialog/showOpenDirDialog';
import { createTerminalControllers } from '@/controllers/terminal';
import { createExecCmdLinesInTerminalUseCase } from '@/application/useCases/terminal/execCmdLinesInTerminal';
import { createAppsProvider } from '@/infra/appsProvider/appsProvider';
import { createChildProcessProvider } from '@/infra/childProcessProvider/childProcessProvider';
import { createOpenPathUseCase } from '@/application/useCases/shell/openPath';
import { createCopyWidgetDataStorageUseCase } from '@/application/useCases/widgetDataStorage/copyWidgetDataStorage';
import { createOpenAppUseCase } from '@/application/useCases/shell/openApp';
import { createStateSyncControllers } from '@/controllers/stateSync';
import { createAppConfigControllers } from '@/controllers/appConfig';

let appWindow: BrowserWindow | null = null; // ref to the first app window
const allWindows: Map<number, BrowserWindow> = new Map(); // track all windows by ID
let windowCounter = 0;
let isQuittingApp = false;

if (!app.requestSingleInstanceLock()) {
  // there is another instance of the app running
  app.quit();
} {
  app.on('second-instance', (_event, commandLine, _workingDirectory, _additionalData) => {
    // Check if the second instance was started with a protocol URL
    const protocolArg = commandLine.find(arg => arg.startsWith('freeter://'));
    if (protocolArg) {
      handleOAuthRedirect(protocolArg);
    } else {
      // Show and focus any visible window, prioritize the first window
      let visibleWindow: BrowserWindow | null = null;
      for (const [_, window] of allWindows) {
        if (window && !window.isMinimized()) {
          visibleWindow = window;
          break;
        }
      }
      visibleWindow = visibleWindow || appWindow;
      
      if (visibleWindow) {
        if (!visibleWindow.isVisible()) {
          visibleWindow.show();
        }
        if (visibleWindow.isMinimized()) {
          visibleWindow.restore()
        }
        visibleWindow.focus()
      } else if (allWindows.size > 0) {
        // No visible windows, show the first one
        const firstWindow = allWindows.values().next().value;
        if (firstWindow) {
          firstWindow.show();
          firstWindow.restore();
          firstWindow.focus();
        }
      }
    }
  })

  const globalShortcutProvider = createGlobalShortcutProvider();

  const processProvider = createProcessProvider();
  const processInfo = processProvider.getProcessInfo();
  const { isDevMode } = processInfo;

  // Register OAuth protocol handler for redirects
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('freeter', process.execPath, [process.argv[1]]);
    }
  } else {
    app.setAsDefaultProtocolClient('freeter');
  }

  // Handle OAuth redirects
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleOAuthRedirect(url);
  });

  // Helper function to handle OAuth redirects
  function handleOAuthRedirect(url: string) {
    // Find the first visible window and focus it
    let targetWindow: BrowserWindow | null = null;
    for (const [_, window] of allWindows) {
      if (window && !window.isMinimized()) {
        targetWindow = window;
        break;
      }
    }
    targetWindow = targetWindow || appWindow;
    
    if (targetWindow) {
      if (!targetWindow.isVisible()) {
        targetWindow.show();
      }
      if (targetWindow.isMinimized()) {
        targetWindow.restore();
      }
      targetWindow.focus();
      
      // Optionally, you can send the OAuth callback URL to the renderer
      // to handle the OAuth completion
      const electronWindow = targetWindow as any;
      electronWindow.webContents.send('oauth-callback', url);
    }
  }

  registerAppFileProtocol(isDevMode);

  // Some keypoints for the user-agent spoofing.
  // 1. User agent cannot be modified on per website basis, as it will cause
  //    failed verifications on captcha-less web challenge services (which
  //    require the same UA for both the webpage and web worker services)
  //    This is the highest priority as there are many websites depending
  //    on the web challenge.
  // 2. If it will be needed in the future to add some flexibility in the
  //    UA control, then it might be done by changing UA on per-session basis,
  //    in that case both the webpage and the web worker will share the same UA.
  // 3. 'Electron' in the user agent causes "unsupported browser" error on some websites.
  // 4. 'Electron' removal causes issues on some websites (such as google's ones).
  //    For such websites we have to add exceptions and use the original UA.
  // 5. Currently the original UA for the excepted websites is set on per-website
  //    basis. This might break someday (see point 1), in that case consider
  //    implementing the UA change on per-session basis (see point 2).
  const uaOriginal = app.userAgentFallback;
  app.userAgentFallback = app.userAgentFallback.replace(/[Ee]lectron.*?\s/g, '');

  app.on('before-quit', () => {
    isQuittingApp = true;
  });

  app.on('will-quit', () => {
    // Unregister global shortcuts
    globalShortcutProvider.destroy();
  })

  app.whenReady().then(async () => {
    // Configure session persistence for webviews
    // Electron automatically persists sessions when partition starts with "persist:"
    
    // Configure webview sessions when they are created
    app.on('web-contents-created', (event, contents) => {
      // Check if it's a webview
      if (contents.getType() === 'webview') {
        contents.on('will-attach-webview', (event, webPreferences, params) => {
          // Get the partition from params
          const partition = params.partition;
          
          // If partition starts with 'persist', ensure the session is configured properly
          if (partition && partition.startsWith('persist')) {
            // Create/get the session with cache enabled for persistence
            const partitionSession = session.fromPartition(partition, { cache: true });
            
            // Configure cookie policy to ensure they persist
            partitionSession.cookies.on('changed', () => {
              // This ensures cookies are written to disk
              partitionSession.cookies.flushStore().catch(console.error);
            });
            
            // Enable all persistence features
            partitionSession.setPermissionRequestHandler((webContents: any, permission: string, callback: (granted: boolean) => void) => {
              // Allow storage-related permissions
              callback(true); // Be permissive for webview functionality
            });
          } else if (partition && partition.startsWith('browser')) {
            // Handle browser widget partitions
            const partitionSession = session.fromPartition(partition, { cache: true });
            
            // Configure cookie policy for browser widgets
            partitionSession.cookies.on('changed', () => {
              partitionSession.cookies.flushStore().catch(console.error);
            });
            
            partitionSession.setPermissionRequestHandler((webContents: any, permission: string, callback: (granted: boolean) => void) => {
              callback(true);
            });
          }
        });
      }
    });

    const ipcMainEventValidator = createIpcMainEventValidator(channelPrefix, hostFreeterApp);
    const ipcMain = createIpcMain(ipcMainEventValidator);

    const appDataStorage = await createFileDataStorage('string', join(app.getPath('appData'), 'freeter2', 'freeter-data'));
    const getTextFromAppDataStorageUseCase = createGetTextFromAppDataStorageUseCase({ appDataStorage });
    const setTextInAppDataStorageUseCase = createSetTextInAppDataStorageUseCase({ appDataStorage });

    const getWidgetDataStoragePath = (id: string) => join(app.getPath('appData'), 'freeter2', 'freeter-data', 'widgets', id);
    const widgetDataStorageManager = createObjectManager(
      (id) => createFileDataStorage('string', getWidgetDataStoragePath(id)),
      (fromId, toId) => copyFileDataStorage(getWidgetDataStoragePath(fromId), getWidgetDataStoragePath(toId))
    );
    const getTextFromWidgetDataStorageUseCase = createGetTextFromWidgetDataStorageUseCase({ widgetDataStorageManager });
    const setTextInWidgetDataStorageUseCase = createSetTextInWidgetDataStorageUseCase({ widgetDataStorageManager });
    const deleteInWidgetDataStorageUseCase = createDeleteInWidgetDataStorageUseCase({ widgetDataStorageManager });
    const clearWidgetDataStorageUseCase = createClearWidgetDataStorageUseCase({ widgetDataStorageManager });
    const getKeysFromWidgetDataStorageUseCase = createGetKeysFromWidgetDataStorageUseCase({ widgetDataStorageManager });
    const copyWidgetDataStorageUseCase = createCopyWidgetDataStorageUseCase({ widgetDataStorageManager });

    const contextMenuProvider = createContextMenuProvider();
    const popupContextMenuUseCase = createPopupContextMenuUseCase({ contextMenuProvider });

    const clipboardProvider = createClipboardProvider();
    const writeBookmarkIntoClipboardUseCase = createWriteBookmarkIntoClipboardUseCase({ clipboardProvider });
    const writeTextIntoClipboardUseCase = createWriteTextIntoClipboardUseCase({ clipboardProvider });

    const shellProvider = createShellProvider();
    const openExternalUrlUseCase = createOpenExternalUrlUseCase({ shellProvider });
    const openPathUseCase = createOpenPathUseCase({ shellProvider })

    const getProcessInfoUseCase = createGetProcessInfoUseCase({ processProvider });
    const { isLinux } = await getProcessInfoUseCase();

    const dialogProvider = createDialogProvider();
    const dialogShowMessageBoxUseCase = createShowMessageBoxUseCase({ dialogProvider });
    const showOpenFileDialogUseCase = createShowOpenFileDialogUseCase({ dialogProvider });
    const showSaveFileDialogUseCase = createShowSaveFileDialogUseCase({ dialogProvider });
    const showOpenDirDialogUseCase = createShowOpenDirDialogUseCase({ dialogProvider });

    const appMenuProvider = createAppMenuProvider();
    const setAppMenuUseCase = createSetAppMenuUseCase({ appMenuProvider });
    const setAppMenuAutoHideUseCase = createSetAppMenuAutoHideUseCase({ appMenuProvider })

    const setMainShortcutUseCase = createSetMainShortcutUseCase({ globalShortcutProvider });

    const trayProvider = createTrayProvider(join(app.getAppPath(), 'assets', 'app-icons', '16.png'));
    const setTrayMenuUseCase = createSetTrayMenuUseCase({ trayProvider });
    const initTrayUseCase = createInitTrayUseCase({ trayProvider, setTrayMenuUseCase });

    const showBrowserWindowUseCase = createShowBrowserWindowUseCase();

    const appsProvider = createAppsProvider();
    const childProcessProvider = createChildProcessProvider();
    const execCmdLinesInTerminalUseCase = createExecCmdLinesInTerminalUseCase({ appsProvider, childProcessProvider, processProvider })

    const openAppUseCase = createOpenAppUseCase({ childProcessProvider, processProvider })

    // Function to create a new window
    const createNewWindow = async (): Promise<BrowserWindow> => {
      return new Promise(async (resolve) => {
        const windowId = ++windowCounter;
        const windowKey = windowId === 1 ? 'state.json' : `state-window-${windowId}.json`;
        
        const windowDataStorage = windowId === 1 
          ? appDataStorage 
          : await createFileDataStorage('string', join(app.getPath('appData'), 'freeter2', 'freeter-data', windowKey));
        
        const [windowStore] = createWindowStore({
          stateStorage: createWindowStateStorage(
            setTextOnlyIfChanged(withJson(windowDataStorage))
          )
        }, {
          h: 700,
          w: 1200,
          x: 100 + (allWindows.size * 30),
          y: 100 + (allWindows.size * 30),
          isFull: false,
          isMaxi: false,
          isMini: false
        }, () => {
          const getWindowStateUseCase = createGetWindowStateUseCase({ windowStore })
          const setWindowStateUseCase = createSetWindowStateUseCase({ windowStore })
          
          const url = isDevMode ? 'http://localhost:4005' : `${schemeFreeterFile}://${hostFreeterApp}/index.html`;
          
          const newWindow = createRendererWindow(
            `${__dirname}/preload.js`,
            url,
            isLinux ? join(app.getAppPath(), 'assets', 'app-icons', '256.png') : undefined,
            uaOriginal,
            {
              getWindowStateUseCase,
              setWindowStateUseCase
            },
            {
              devTools: isDevMode,
            }
          );
          
          // Track the new window
          allWindows.set(windowId, newWindow);
          
          // Override the default close behavior for multi-window support
          const electronWindow = newWindow as any;
          electronWindow.removeAllListeners('close');
          electronWindow.on('close', (e: any) => {
            if (allWindows.size > 1) {
              // Multiple windows - allow this one to close
              // The window will be removed from tracking in the 'closed' event
            } else {
              // Last window - hide instead of close (unless quitting)
              if (!isQuittingApp) {
                electronWindow.hide();
                e.preventDefault();
              }
            }
          });
          
          // Handle window closed
          electronWindow.on('closed', () => {
            allWindows.delete(windowId);
            if (windowId === 1 && appWindow === newWindow) {
              appWindow = null;
            }
          });
          
          // Set up child window handlers if not the first window
          if (windowId > 1) {
            app.on('browser-window-created', (_e, win) => {
              // Disable menu in child windows of this window
              if ((win as any).getParentWindow && (win as any).getParentWindow() === newWindow) {
                win.removeMenu();
                win.setAlwaysOnTop(false);
                
                win.on('closed', () => {
                  newWindow.focus();
                });
              }
            });
          }
          
          resolve(newWindow);
        });
      });
    };

    const openNewWindowUseCase = createOpenNewWindowUseCase({ createNewWindow });

    registerControllers(ipcMain, [
      ...createAppDataStorageControllers({ getTextFromAppDataStorageUseCase, setTextInAppDataStorageUseCase }),
      ...createWidgetDataStorageControllers({
        getTextFromWidgetDataStorageUseCase,
        setTextInWidgetDataStorageUseCase,
        clearWidgetDataStorageUseCase,
        deleteInWidgetDataStorageUseCase,
        getKeysFromWidgetDataStorageUseCase,
        copyWidgetDataStorageUseCase,
      }),
      ...createContextMenuControllers({ popupContextMenuUseCase }),
      ...createClipboardControllers({ writeBookmarkIntoClipboardUseCase, writeTextIntoClipboardUseCase }),
      ...createShellControllers({ openExternalUrlUseCase, openPathUseCase, openAppUseCase }),
      ...createProcessControllers({ getProcessInfoUseCase }),
      ...createDialogControllers({
        showMessageBoxUseCase: dialogShowMessageBoxUseCase,
        showOpenDirDialogUseCase,
        showOpenFileDialogUseCase,
        showSaveFileDialogUseCase
      }),
      ...createAppMenuControllers({ setAppMenuUseCase, setAppMenuAutoHideUseCase }),
      ...createGlobalShortcutControllers({ setMainShortcutUseCase }),
      ...createTrayMenuControllers({ setTrayMenuUseCase }),
      ...createBrowserWindowControllers({ showBrowserWindowUseCase, openNewWindowUseCase }),
      ...createTerminalControllers({ execCmdLinesInTerminalUseCase }),
      ...createStateSyncControllers({ getAllWindows: () => allWindows }),
      ...createAppConfigControllers()
    ])

    // Create the first window
    createNewWindow().then((firstWindow) => {
      appWindow = firstWindow;
      initTrayUseCase(appWindow);
    });
  });

}
