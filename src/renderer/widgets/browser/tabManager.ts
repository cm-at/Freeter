/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  webview?: Electron.WebviewTag;
}

export interface TabManagerState {
  tabs: Array<{
    id: string;
    url: string;
    title: string;
    favicon?: string;
  }>;
  activeTabId: string;
  tabCounter: number;
}

export class TabManager {
  private tabs: BrowserTab[] = [];
  private activeTabId: string = '';
  private tabCounter = 0;
  private maxTabs: number;
  private onStateChange?: (state: TabManagerState) => void;

  constructor(maxTabs: number = 10, onStateChange?: (state: TabManagerState) => void) {
    this.maxTabs = maxTabs;
    this.onStateChange = onStateChange;
  }

  loadState(state: TabManagerState): void {
    this.tabs = state.tabs.map(tabData => ({
      ...tabData,
      isLoading: false,
      webview: undefined
    }));
    this.activeTabId = state.activeTabId;
    this.tabCounter = state.tabCounter;
  }

  getState(): TabManagerState {
    return {
      tabs: this.tabs.map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon
      })),
      activeTabId: this.activeTabId,
      tabCounter: this.tabCounter
    };
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  addTab(url: string = 'about:blank'): BrowserTab | null {
    if (this.tabs.length >= this.maxTabs) {
      return null;
    }

    const tab: BrowserTab = {
      id: `tab-${++this.tabCounter}`,
      url,
      title: 'New Tab',
      isLoading: false
    };

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.notifyStateChange();
    return tab;
  }

  removeTab(tabId: string): void {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    // If we removed the active tab, activate another one
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        // Try to activate the tab at the same index, or the previous one
        const newIndex = Math.min(index, this.tabs.length - 1);
        this.activeTabId = this.tabs[newIndex].id;
      } else {
        this.activeTabId = '';
      }
    }
    this.notifyStateChange();
  }

  setActiveTab(tabId: string): void {
    if (this.tabs.find(t => t.id === tabId)) {
      this.activeTabId = tabId;
      this.notifyStateChange();
    }
  }

  getTab(tabId: string): BrowserTab | undefined {
    return this.tabs.find(t => t.id === tabId);
  }

  getActiveTab(): BrowserTab | undefined {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  getTabs(): BrowserTab[] {
    return this.tabs;
  }

  getActiveTabId(): string {
    return this.activeTabId;
  }

  updateTab(tabId: string, updates: Partial<BrowserTab>): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, updates);
      this.notifyStateChange();
    }
  }
} 