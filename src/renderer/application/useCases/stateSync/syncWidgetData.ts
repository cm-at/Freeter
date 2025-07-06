/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { IpcStateSyncArgs, IpcStateSyncRes, ipcStateSyncChannel } from '@common/ipc/channels';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { debounce } from '@common/helpers/debounce';

type WidgetDataChange = {
  widgetId: string;
  key: string;
  value: any;
  timestamp: number;
};

type Deps = {
  onWidgetDataReceived: (widgetId: string, key: string, value: any) => void;
}

export const createSyncWidgetDataUseCase = ({
  onWidgetDataReceived
}: Deps) => {
  // Track last update timestamps to avoid circular updates
  const lastUpdateTimestamps = new Map<string, number>();
  const windowId = Date.now(); // Use timestamp as window ID
  
  // Debounce state notifications to avoid performance issues
  const debouncedNotify = debounce((widgetId: string, data: any) => {
    const timestamp = Date.now();
    const key = `widget-${widgetId}`;
    lastUpdateTimestamps.set(key, timestamp);
    
    const args: IpcStateSyncArgs = {
      type: 'widget-data-update',
      payload: {
        widgetId,
        widgetData: data
      },
      sourceWindowId: windowId,
      timestamp
    };
    
    electronIpcRenderer.invoke<[IpcStateSyncArgs], IpcStateSyncRes>(ipcStateSyncChannel, args);
  }, 300);
  
  // Handle incoming widget data sync messages
  const handleWidgetDataSync = (_event: any, args: IpcStateSyncArgs) => {
    if (args.type === 'widget-data-update' && args.sourceWindowId !== windowId) {
      const { widgetId, widgetData } = args.payload;
      const key = `widget-${widgetId}`;
      const lastTimestamp = lastUpdateTimestamps.get(key) || 0;
      
      // Only apply if the incoming update is newer
      if (args.timestamp > lastTimestamp && widgetId && widgetData !== undefined) {
        lastUpdateTimestamps.set(key, args.timestamp);
        
        // Apply all keys from widgetData
        Object.entries(widgetData).forEach(([key, value]) => {
          onWidgetDataReceived(widgetId, key, value);
        });
      }
    }
  };
  
  let isListening = false;
  
  return () => ({
    startSync: () => {
      if (!isListening) {
        electronIpcRenderer.on(ipcStateSyncChannel, handleWidgetDataSync);
        isListening = true;
      }
    },
    
    stopSync: () => {
      if (isListening) {
        electronIpcRenderer.removeListener(ipcStateSyncChannel, handleWidgetDataSync);
        isListening = false;
      }
    },
    
    notifyWidgetDataChange: (widgetId: string, data: Record<string, any>) => {
      debouncedNotify(widgetId, data);
    }
  });
};

export type SyncWidgetDataUseCase = ReturnType<typeof createSyncWidgetDataUseCase>; 