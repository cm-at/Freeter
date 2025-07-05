/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetApi } from '@/base/widgetApi';

export interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
}

const HISTORY_STORAGE_KEY = 'browser-widget-history';

export class HistoryManager {
  private history: HistoryItem[] = [];
  private maxItems: number = 100;
  private widgetApi: WidgetApi;

  constructor(widgetApi: WidgetApi, maxItems: number = 100) {
    this.widgetApi = widgetApi;
    this.maxItems = maxItems;
  }

  async loadHistory(): Promise<void> {
    try {
      const data = await this.widgetApi.dataStorage.getText(HISTORY_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.history = parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load browser history:', error);
      this.history = [];
    }
  }

  async saveHistory(): Promise<void> {
    try {
      await this.widgetApi.dataStorage.setText(HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save browser history:', error);
    }
  }

  addToHistory(url: string, title: string): void {
    if (!url || url === 'about:blank') return;

    // Check if URL already exists in history
    const existingIndex = this.history.findIndex(item => item.url === url);
    
    if (existingIndex !== -1) {
      // Update existing entry
      const existing = this.history[existingIndex];
      existing.visitCount++;
      existing.timestamp = Date.now();
      existing.title = title || existing.title;
      
      // Move to front
      this.history.splice(existingIndex, 1);
      this.history.unshift(existing);
    } else {
      // Add new entry
      const newItem: HistoryItem = {
        url,
        title: title || url,
        timestamp: Date.now(),
        visitCount: 1
      };
      
      this.history.unshift(newItem);
      
      // Trim history if needed
      if (this.history.length > this.maxItems) {
        this.history = this.history.slice(0, this.maxItems);
      }
    }

    // Save history asynchronously
    this.saveHistory();
  }

  getHistory(): HistoryItem[] {
    return this.history;
  }

  searchHistory(query: string): HistoryItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.history.filter(item => 
      item.url.toLowerCase().includes(lowercaseQuery) ||
      item.title.toLowerCase().includes(lowercaseQuery)
    );
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  removeFromHistory(url: string): void {
    this.history = this.history.filter(item => item.url !== url);
    this.saveHistory();
  }

  setMaxItems(maxItems: number): void {
    this.maxItems = maxItems;
    if (this.history.length > maxItems) {
      this.history = this.history.slice(0, maxItems);
      this.saveHistory();
    }
  }
} 