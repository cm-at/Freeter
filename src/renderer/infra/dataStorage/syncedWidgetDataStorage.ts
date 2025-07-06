/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { DataStorage } from '@common/application/interfaces/dataStorage';
import { createWidgetDataStorage } from './widgetDataStorage';

type Deps = {
  notifyChange: (widgetId: string, data: Record<string, any>) => void;
  widgetDataCache: Map<string, Map<string, any>>;
}

export function createSyncedWidgetDataStorage(
  widgetId: string,
  { notifyChange, widgetDataCache }: Deps
): DataStorage {
  const baseStorage = createWidgetDataStorage(widgetId);
  
  // Get or create cache for this widget
  if (!widgetDataCache.has(widgetId)) {
    widgetDataCache.set(widgetId, new Map());
  }
  const cache = widgetDataCache.get(widgetId)!;
  
  return {
    getText: async (key) => {
      const cachedValue = cache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
      const value = await baseStorage.getText(key);
      if (value !== null) {
        cache.set(key, value);
      }
      return value;
    },
    
    setText: async (key, text) => {
      cache.set(key, text);
      await baseStorage.setText(key, text);
      notifyChange(widgetId, { [key]: text });
    },
    
    deleteItem: async (key) => {
      cache.delete(key);
      await baseStorage.deleteItem(key);
      notifyChange(widgetId, { [key]: null });
    },
    
    clear: async () => {
      cache.clear();
      await baseStorage.clear();
      notifyChange(widgetId, {});
    },
    
    getKeys: async () => {
      return baseStorage.getKeys();
    }
  };
} 