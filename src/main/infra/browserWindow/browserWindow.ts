/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { BrowserWindowConstructorOptions, BrowserWindow as ElectronBrowserWindow, app, shell } from 'electron';
import { BrowserWindow } from '@/application/interfaces/browserWindow'
import { GetWindowStateUseCase } from '@/application/useCases/browserWindow/getWindowState';
import { SetWindowStateUseCase } from '@/application/useCases/browserWindow/setWindowState';
import { getPopupDomains } from '@/controllers/appConfig';

const minWidth = 1200;
const minHeight = 600;

const defaultWinParams = {
  width: 1200,
  height: 700,
}

// urls requiring the original user-agent
const reUrlsRequiringOriginalUA: RegExp[] = [
  /^https?:\/\/(?:[a-z0-9-_]*\.)+google.com\/?/i // Google Apps
]

/**
 * BrowserWindow factory
 *
 * Should be called **in `app.whenReady().then(...)`**
 */
export function createRendererWindow(
  preload: string,
  url: string,
  icon: string | undefined,
  uaOriginal: string,
  deps: {
    getWindowStateUseCase: GetWindowStateUseCase,
    setWindowStateUseCase: SetWindowStateUseCase,
  },
  opts: {
    devTools?: boolean,
  }
): BrowserWindow {
  const { getWindowStateUseCase, setWindowStateUseCase } = deps;
  const { h, w, x, y, isFull, isMaxi, isMini } = getWindowStateUseCase();
  const setDefaultValues = h < minHeight || w < minWidth;

  const win = new ElectronBrowserWindow({
    ...(setDefaultValues
      ? defaultWinParams
      : {
        width: w,
        height: h,
        x,
        y
      }
    ),
    icon,
    title: 'Freeter',
    minWidth,
    minHeight,
    webPreferences: {
      // (SECURITY) Disable access to NodeJS in Renderer
      nodeIntegration: false,
      // (SECURITY) Isolate global objects in preload script
      contextIsolation: true,
      webSecurity: true,
      preload,
      webviewTag: true,
    }
  });
  if (isMaxi) {
    win.maximize();
  }
  if (isFull) {
    win.setFullScreen(true)
  }
  if (isMini) {
    win.minimize();
  }

  function winStateUpdateHandler() {
    const { height, width, x, y } = win.getNormalBounds();
    setWindowStateUseCase({
      x,
      y,
      w: width,
      h: height,
      isFull: win.isFullScreen(),
      isMini: win.isMinimized(),
      isMaxi: win.isMaximized()
    })
  }

  let isQuittingApp = false;
  app.on('before-quit', () => {
    isQuittingApp = true;
  });
  win.on('close', e => {
    if (!isQuittingApp) {
      // Hide, don't close
      win.hide();
      e.preventDefault();
    }
  });

  // Fix for black screen when returning from popups/OAuth redirects
  win.on('focus', () => {
    // Force a repaint when window gains focus
    win.webContents.invalidate();
  });

  win.on('show', () => {
    // Force a repaint when window is shown
    win.webContents.invalidate();
  });

  // Handle visibility changes to prevent black screens
  win.on('blur', () => {
    // Sometimes webviews stop rendering when window loses focus
    // This ensures they continue to render
    win.webContents.setBackgroundThrottling(false);
  });

  // Additional black screen prevention
  win.webContents.on('did-finish-load', () => {
    // Ensure the window is properly rendered after load
    win.webContents.setVisualZoomLevelLimits(1, 1);
    win.webContents.setBackgroundThrottling(false);
  });

  // Handle renderer crashes
  win.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    if (details.reason === 'crashed') {
      // Reload the window on crash
      win.reload();
    }
  });

  win.on('resize', winStateUpdateHandler);
  win.on('move', winStateUpdateHandler);
  win.on('minimize', winStateUpdateHandler);
  win.on('restore', winStateUpdateHandler);
  win.on('maximize', winStateUpdateHandler);
  win.on('unmaximize', winStateUpdateHandler);
  win.on('enter-full-screen', winStateUpdateHandler);
  win.on('leave-full-screen', winStateUpdateHandler);

  // prevent leaving the app page (by dragging an image for example)
  win.webContents.on('will-navigate', evt => evt.preventDefault());

  // set original user-agent for urls requiring it
  win.webContents.on('will-attach-webview', (_, wp, params) => {
    for (const re of reUrlsRequiringOriginalUA) {
      if (params.src.match(re)) {
        params.useragent = uaOriginal;
        break;
      }
    }
  })

  // enable new windows in webview
  win.webContents.on('did-attach-webview', (_, wc) => {
    wc.setWindowOpenHandler((details) => {
      // Get current popup domain configuration
      const popupDomains = getPopupDomains();
      
      // Check if URL matches any enabled popup pattern
      const shouldOpenAsPopup = popupDomains.some(domain => {
        if (!domain.enabled) return false;
        
        if (domain.isRegex) {
          try {
            const regex = new RegExp(domain.pattern);
            return regex.test(details.url);
          } catch (e) {
            return false;
          }
        } else {
          // Plain text match anywhere in URL
          return details.url.includes(domain.pattern);
        }
      });

      // If URL doesn't match popup patterns, open in default browser
      if (!shouldOpenAsPopup) {
        shell.openExternal(details.url);
        return { action: 'deny' };
      }

      // Open as popup window
      // Determine the new window position and size
      const [parentW, parentH] = win.getSize();
      const [parentX, parentY] = win.getPosition();
      
      let newW = 1200;
      let newH = 700;
      
      // If features are specified, try to use them
      if (details.features) {
        const features = details.features.split(',').reduce((acc, feature) => {
          const [key, value] = feature.split('=');
          acc[key.trim()] = value ? value.trim() : 'yes';
          return acc;
        }, {} as Record<string, string>);
        
        if (features.width) {
          newW = parseInt(features.width, 10) || newW;
        }
        if (features.height) {
          newH = parseInt(features.height, 10) || newH;
        }
      }
      
      // Center the new window relative to parent
      const newX = Math.round(parentX + (parentW - newW) / 2);
      const newY = Math.round(parentY + (parentH - newH) / 2);
      
      const browserWinOpts: BrowserWindowConstructorOptions = {
        width: newW,
        height: newH,
        x: newX,
        y: newY,
        minimizable: true,
        maximizable: true,
        closable: true,
        icon,
        parent: win,
        modal: false, // Never make it modal
        alwaysOnTop: false, // Don't force on top
        skipTaskbar: false, // Show in taskbar
        title: details.frameName || 'Freeter',
        backgroundColor: '#ffffff', // Prevent black background
        webPreferences: {
          session: wc.session,
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          backgroundThrottling: false // Prevent rendering issues
        }
      }
      
      return {
        action: 'allow',
        outlivesOpener: true, // Allow it to stay open if parent closes
        overrideBrowserWindowOptions: browserWinOpts
      }
    })

    // Fix rendering issues in webviews
    wc.on('paint', () => {
      // Ensure webview continues to render properly
      wc.setBackgroundThrottling(false);
    });

    // Handle navigation that might cause black screens
    wc.on('did-navigate', () => {
      // Force repaint after navigation
      wc.invalidate();
    });

    wc.on('did-navigate-in-page', () => {
      // Force repaint after in-page navigation
      wc.invalidate();
    });
  })

  // and load the index.html of the app.
  win.loadURL(url);
  if (opts.devTools) {
    win.webContents.openDevTools();
  }

  return win;
}
