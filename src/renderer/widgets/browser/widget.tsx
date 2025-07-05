/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ContextMenuEvent, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createActionBarItems } from './actionBar';
import { sanitizeUrl } from '@common/helpers/sanitizeUrl';
import { createContextMenuFactory } from './contextMenu';
import { ContextMenuEvent as ElectronContextMenuEvent } from 'electron';
import { createPartition } from './partition';
import { BrowserTab, TabManager, TabManagerState } from './tabManager';
import { HistoryManager } from './historyManager';
import { BrowserExposedApi } from '@/widgets/interfaces';
import { backSvg, forwardSvg, homeSvg, reloadSvg, reloadStopSvg } from './icons';
import { SvgIcon } from '@/ui/components/basic/svgIcon';

const TABS_STORAGE_KEY = 'browser-widget-tabs';

interface BrowserViewProps {
  tab: BrowserTab;
  isActive: boolean;
  onNavigate: (url: string) => void;
  onTitleUpdate: (title: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onFaviconUpdate: (favicon: string) => void;
  onWebviewReady: (webview: Electron.WebviewTag) => void;
  settings: Settings;
  widgetApi: any;
  env: any;
  partition: string;
  injectedCSS: string;
  injectedJS: string;
  userAgent: string;
  historyManager: HistoryManager;
}

function BrowserView({ tab, isActive, onNavigate, onTitleUpdate, onLoadingChange, onFaviconUpdate, onWebviewReady, settings, widgetApi, env, partition, injectedCSS, injectedJS, userAgent, historyManager }: BrowserViewProps) {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [cssInDom, setCssInDom] = useState<[string, string] | null>(null);
  const [webviewIsReady, setWebviewIsReady] = useState(false);

  const sanitUrl = useMemo(() => sanitizeUrl(tab.url), [tab.url]);
  const sanitUA = useMemo(() => userAgent.trim(), [userAgent]);

  const injectCSSInDOM = useCallback(
    async (css: string, force: boolean) => {
      if (webviewIsReady) {
        if (!force && cssInDom && cssInDom[1] === css) {
          return;
        }
        const webviewEl = webviewRef.current;
        if (!webviewEl) {
          return;
        }
        const removeCss = cssInDom && cssInDom[0];
        if (css.trim() !== '') {
          const k = await webviewEl.insertCSS(css);
          setCssInDom([k, css]);
        } else {
          setCssInDom(null);
        }
        if (removeCss) {
          webviewEl.removeInsertedCSS(removeCss);
        }
      }
    },
    [cssInDom, webviewIsReady]
  );

  useEffect(() => {
    const webviewEl = webviewRef.current;
    if (!webviewEl) return;

    const handleDidStartLoading = () => {
      onLoadingChange(true);
    };
    const handleDidStopLoading = () => {
      onLoadingChange(false);
    };
    const handleDidNavigate = () => {
      const url = webviewEl.getURL();
      onNavigate(url);
      historyManager.addToHistory(url, webviewEl.getTitle());
    };
    const handlePageTitleUpdated = (e: any) => {
      onTitleUpdate(e.title);
    };
    const handlePageFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        onFaviconUpdate(e.favicons[0]);
      }
    };
    const handleDomReady = () => {
      setWebviewIsReady(true);
      injectCSSInDOM(injectedCSS, true);
      if (injectedJS) {
        webviewEl.executeJavaScript(injectedJS);
      }
      onWebviewReady(webviewEl);
    };
    const handleContextMenu = (e: ElectronContextMenuEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const evt = new MouseEvent('contextmenu', { bubbles: true }) as ContextMenuEvent;
      evt.contextData = e.params;
      webviewEl.dispatchEvent(evt);
    };

    webviewEl.addEventListener('did-start-loading', handleDidStartLoading);
    webviewEl.addEventListener('did-stop-loading', handleDidStopLoading);
    webviewEl.addEventListener('did-navigate', handleDidNavigate);
    webviewEl.addEventListener('page-title-updated', handlePageTitleUpdated);
    webviewEl.addEventListener('page-favicon-updated', handlePageFaviconUpdated);
    webviewEl.addEventListener('dom-ready', handleDomReady);
    webviewEl.addEventListener('context-menu', handleContextMenu);

    if (tab.webview !== webviewEl) {
      tab.webview = webviewEl;
    }

    return () => {
      webviewEl.removeEventListener('did-start-loading', handleDidStartLoading);
      webviewEl.removeEventListener('did-stop-loading', handleDidStopLoading);
      webviewEl.removeEventListener('did-navigate', handleDidNavigate);
      webviewEl.removeEventListener('page-title-updated', handlePageTitleUpdated);
      webviewEl.removeEventListener('page-favicon-updated', handlePageFaviconUpdated);
      webviewEl.removeEventListener('dom-ready', handleDomReady);
      webviewEl.removeEventListener('context-menu', handleContextMenu);
    };
  }, [injectedCSS, injectedJS, onLoadingChange, onNavigate, onTitleUpdate, onFaviconUpdate, tab, injectCSSInDOM, historyManager, onWebviewReady]);

  useEffect(() => {
    injectCSSInDOM(injectedCSS, false);
  }, [injectedCSS, injectCSSInDOM]);

  return (
    <webview
      ref={webviewRef}
      className={`${styles.webview} ${isActive ? styles.active : ''}`}
      allowpopups={'' as unknown as boolean}
      partition={partition}
      src={sanitUrl !== '' ? sanitUrl : undefined}
      useragent={sanitUA !== '' ? sanitUA : undefined}
      tabIndex={isActive ? 0 : -1}
    />
  );
}

export function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const { settings, widgetApi, env, id } = props;
  const { sessionScope, sessionPersist, homeUrl, injectedCSS, injectedJS, userAgent, maxTabs } = settings;

  const [addressBarValue, setAddressBarValue] = useState('');
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const activeWebviewRef = useRef<Electron.WebviewTag | null>(null);
  const tabManagerRef = useRef<TabManager | null>(null);
  const [historyManager] = useState(() => new HistoryManager(widgetApi));
  const [isInitialized, setIsInitialized] = useState(false);

  const partition = useMemo(() => createPartition(sessionPersist, sessionScope, env, id), [
    env, id, sessionScope, sessionPersist
  ]);

  // Initialize tab manager with state persistence
  useEffect(() => {
    const onTabStateChange = async (state: TabManagerState) => {
      try {
        await widgetApi.dataStorage.setText(TABS_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save tabs state:', error);
      }
    };

    const tabManager = new TabManager(maxTabs, onTabStateChange);
    tabManagerRef.current = tabManager;

    // Load saved tabs
    const loadTabs = async () => {
      try {
        const savedState = await widgetApi.dataStorage.getText(TABS_STORAGE_KEY);
        if (savedState) {
          const state: TabManagerState = JSON.parse(savedState);
          tabManager.loadState(state);
          setTabs(tabManager.getTabs());
          setActiveTabId(tabManager.getActiveTabId());
          
          // Set address bar value for active tab
          const activeTab = tabManager.getActiveTab();
          if (activeTab) {
            setAddressBarValue(activeTab.url);
          }
        } else {
          // No saved state, create initial tab
          const newTab = tabManager.addTab(homeUrl || 'about:blank');
          if (newTab) {
            setAddressBarValue(newTab.url);
          }
          setTabs(tabManager.getTabs());
          setActiveTabId(tabManager.getActiveTabId());
        }
      } catch (error) {
        console.error('Failed to load tabs state:', error);
        // Create initial tab on error
        const newTab = tabManager.addTab(homeUrl || 'about:blank');
        if (newTab) {
          setAddressBarValue(newTab.url);
        }
        setTabs(tabManager.getTabs());
        setActiveTabId(tabManager.getActiveTabId());
      }
      setIsInitialized(true);
    };

    loadTabs();
    historyManager.loadHistory();
  }, [widgetApi.dataStorage, maxTabs, homeUrl, historyManager]);

  const activeTab = useMemo(() => tabs.find((t: BrowserTab) => t.id === activeTabId), [tabs, activeTabId]);

  useEffect(() => {
    historyManager.loadHistory();
  }, [historyManager]);

  useEffect(() => {
    widgetApi.exposeApi<BrowserExposedApi>({
      openUrl: (url: string) => {
        const tab = tabManagerRef.current?.getActiveTab();
        if (tab && tab.webview) {
          tab.webview.loadURL(url);
        }
      },
      getUrl: () => activeTab?.url || '',
    });
  }, [widgetApi, activeTab, tabManagerRef]);

  const refreshUI = useCallback(() => {
    if (tabManagerRef.current) {
      setTabs([...tabManagerRef.current.getTabs()]);
      setActiveTabId(tabManagerRef.current.getActiveTabId());
    }
  }, []);

  const handleNewTab = useCallback(() => {
    if (tabManagerRef.current) {
      const newTab = tabManagerRef.current.addTab(homeUrl || 'about:blank');
      if (newTab) {
        setAddressBarValue(newTab.url);
      }
      refreshUI();
    }
  }, [homeUrl, refreshUI]);

  const handleCloseTab = useCallback((tabId: string) => {
    if (tabManagerRef.current) {
      // Clear webview reference if it's the active tab
      if (tabId === activeTabId) {
        activeWebviewRef.current = null;
      }
      
      tabManagerRef.current.removeTab(tabId);
      refreshUI();
      
      // If no tabs left, create a new one
      if (tabManagerRef.current.getTabs().length === 0) {
        handleNewTab();
      }
    }
  }, [refreshUI, handleNewTab, activeTabId]);

  const handleSelectTab = useCallback((tabId: string) => {
    if (tabManagerRef.current) {
      tabManagerRef.current.setActiveTab(tabId);
      refreshUI();
      const tab = tabManagerRef.current.getTab(tabId);
      if (tab) {
        setAddressBarValue(tab.url);
      }
    }
  }, [refreshUI]);

  const handleAddressBarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressBarValue(e.target.value);
  }, []);

  const handleAddressBarSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    let url = addressBarValue.trim();
    if (!url) return;

    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      // Check if it looks like a domain
      if (/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}/.test(url)) {
        url = 'https://' + url;
      } else {
        // Treat as search query
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    if (tabManagerRef.current) {
      const activeTab = tabManagerRef.current.getActiveTab();
      if (activeTab && activeTab.webview) {
        activeTab.webview.loadURL(url);
      } else if (activeTab) {
        // If webview isn't ready yet, update the tab URL so it loads when ready
        tabManagerRef.current.updateTab(activeTab.id, { url });
        refreshUI();
      }
    }
  }, [addressBarValue, refreshUI]);

  const handleTabNavigate = useCallback((tabId: string, url: string) => {
    if (tabManagerRef.current) {
      const tab = tabManagerRef.current.getTab(tabId);
      if (tab) {
        tabManagerRef.current.updateTab(tabId, { url });
        if (tab.id === activeTabId) {
          setAddressBarValue(url);
        }
        refreshUI();
      }
    }
  }, [activeTabId, refreshUI]);

  const handleTabTitleUpdate = useCallback((tabId: string, title: string) => {
    if (tabManagerRef.current) {
      tabManagerRef.current.updateTab(tabId, { title });
      refreshUI();
    }
  }, [refreshUI]);

  const handleTabLoadingChange = useCallback((tabId: string, isLoading: boolean) => {
    if (tabManagerRef.current) {
      tabManagerRef.current.updateTab(tabId, { isLoading });
      refreshUI();
    }
  }, [refreshUI]);

  const handleTabFaviconUpdate = useCallback((tabId: string, favicon: string) => {
    if (tabManagerRef.current) {
      tabManagerRef.current.updateTab(tabId, { favicon });
      refreshUI();
    }
  }, [refreshUI]);

  const handleWebviewReady = useCallback((tabId: string, webview: Electron.WebviewTag) => {
    if (tabId === activeTabId) {
      activeWebviewRef.current = webview;
      // Update navigation state
      try {
        setCanGoBack(webview.canGoBack());
        setCanGoForward(webview.canGoForward());
      } catch (e) {
        setCanGoBack(false);
        setCanGoForward(false);
      }
    }
  }, [activeTabId]);

  useEffect(() => {
    const { updateActionBar, setContextMenuFactory } = widgetApi;
    updateActionBar(
      createActionBarItems(
        activeWebviewRef.current,
        widgetApi,
        homeUrl,
        historyManager
      )
    );
    setContextMenuFactory(
      createContextMenuFactory(
        activeWebviewRef.current,
        widgetApi,
        historyManager
      )
    );
  }, [widgetApi, activeTab, homeUrl, historyManager, canGoBack, canGoForward]);

  // Update address bar and navigation state when active tab changes
  useEffect(() => {
    if (activeTab) {
      setAddressBarValue(activeTab.url);
      if (activeTab.webview) {
        activeWebviewRef.current = activeTab.webview;
        try {
          setCanGoBack(activeTab.webview.canGoBack());
          setCanGoForward(activeTab.webview.canGoForward());
        } catch (e) {
          setCanGoBack(false);
          setCanGoForward(false);
        }
      }
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    if (activeWebviewRef.current && canGoBack) {
      try {
        activeWebviewRef.current.goBack();
      } catch (e) {
        console.error('Failed to go back:', e);
      }
    }
  }, [canGoBack]);

  const handleForward = useCallback(() => {
    if (activeWebviewRef.current && canGoForward) {
      try {
        activeWebviewRef.current.goForward();
      } catch (e) {
        console.error('Failed to go forward:', e);
      }
    }
  }, [canGoForward]);

  const handleReload = useCallback(() => {
    if (activeWebviewRef.current) {
      try {
        if (activeWebviewRef.current.isLoading()) {
          activeWebviewRef.current.stop();
        } else {
          activeWebviewRef.current.reload();
        }
      } catch (e) {
        console.error('Failed to reload:', e);
      }
    }
  }, []);

  const handleHome = useCallback(() => {
    if (activeWebviewRef.current && homeUrl) {
      try {
        activeWebviewRef.current.loadURL(homeUrl);
      } catch (e) {
        console.error('Failed to go home:', e);
      }
    }
  }, [homeUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+R or Ctrl+R to refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleReload();
      }
      // Cmd+T or Ctrl+T to open new tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Cmd+W or Ctrl+W to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          handleCloseTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReload, handleNewTab, handleCloseTab, activeTabId]);

  // Don't render until initialized
  if (!isInitialized) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.browser}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {tabs.map((tab: BrowserTab) => (
            <div
              key={tab.id}
              className={`${styles.tab} ${tab.id === activeTabId ? styles.activeTab : ''}`}
              onClick={() => handleSelectTab(tab.id)}
            >
              {tab.favicon && <img src={tab.favicon} className={styles.favicon} alt="" />}
              <span className={styles.title}>{tab.title || 'New Tab'}</span>
              {tabs.length > 1 && (
                <button
                  className={styles.closeTab}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {tabs.length < maxTabs && (
            <button className={styles.newTab} onClick={handleNewTab}>+</button>
          )}
        </div>
        <div className={styles.navigationBar}>
          <button 
            className={styles.navButton} 
            onClick={handleBack}
            disabled={!canGoBack}
            title="Go Back"
          >
            <SvgIcon svg={backSvg} className={styles.navIcon} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={handleForward}
            disabled={!canGoForward}
            title="Go Forward"
          >
            <SvgIcon svg={forwardSvg} className={styles.navIcon} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={handleReload}
            title={activeTab?.isLoading ? "Stop (Cmd+R)" : "Reload (Cmd+R)"}
          >
            <SvgIcon svg={activeTab?.isLoading ? reloadStopSvg : reloadSvg} className={styles.navIcon} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={handleHome}
            disabled={!homeUrl}
            title={homeUrl ? "Go Home" : "No home URL configured"}
          >
            <SvgIcon svg={homeSvg} className={styles.navIcon} />
          </button>
          <form className={styles.addressBar} onSubmit={handleAddressBarSubmit}>
            <input
              type="text"
              value={addressBarValue}
              onChange={handleAddressBarChange}
              placeholder="Enter URL or search..."
              className={styles.addressInput}
            />
          </form>
        </div>
      </div>
      <div className={styles.content}>
        {tabs.map((tab: BrowserTab) => (
          <BrowserView
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onNavigate={(url) => handleTabNavigate(tab.id, url)}
            onTitleUpdate={(title) => handleTabTitleUpdate(tab.id, title)}
            onLoadingChange={(isLoading) => handleTabLoadingChange(tab.id, isLoading)}
            onFaviconUpdate={(favicon) => handleTabFaviconUpdate(tab.id, favicon)}
            onWebviewReady={(webview) => handleWebviewReady(tab.id, webview)}
            settings={settings}
            widgetApi={widgetApi}
            env={env}
            partition={partition}
            injectedCSS={injectedCSS}
            injectedJS={injectedJS}
            userAgent={userAgent}
            historyManager={historyManager}
          />
        ))}
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
} 