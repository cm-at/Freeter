/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { IpcStateSyncArgs, IpcStateSyncRes, ipcStateSyncChannel } from '@common/ipc/channels';
import { EntityCollection } from '@/base/entityCollection';
import { debounce } from '@common/helpers/debounce';
import { Project } from '@/base/project';
import { Workflow } from '@/base/workflow';
import { Widget } from '@/base/widget';
import { App } from '@/base/app';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { AppStore } from '@/application/interfaces/store';

type Deps = {
  getProjects: () => EntityCollection<Project>;
  getWorkflows: () => EntityCollection<Workflow>;
  getWidgets: () => EntityCollection<Widget>;
  getApps: () => EntityCollection<App>;
  setProjects: (projects: EntityCollection<Project>) => void;
  setWorkflows: (workflows: EntityCollection<Workflow>) => void;
  setWidgets: (widgets: EntityCollection<Widget>) => void;
  setApps: (apps: EntityCollection<App>) => void;
  appStore: AppStore;
}

export const createSyncStateEntitiesUseCase = ({
  getProjects,
  getWorkflows,
  getWidgets,
  getApps,
  setProjects,
  setWorkflows,
  setWidgets,
  setApps,
  appStore
}: Deps) => {
  // Track last update timestamps to avoid circular updates
  const lastUpdateTimestamps = new Map<string, number>();
  let windowId: number = Date.now(); // Use timestamp as window ID
  
  // Track previous state to detect changes
  let prevProjects: EntityCollection<Project> | null = null;
  let prevWorkflows: EntityCollection<Workflow> | null = null;
  let prevWidgets: EntityCollection<Widget> | null = null;
  let prevApps: EntityCollection<App> | null = null;
  
  // Debounce state notifications to avoid performance issues
  const debouncedNotify = debounce((type: string, data: any) => {
    const timestamp = Date.now();
    lastUpdateTimestamps.set(type, timestamp);
    
    const args: IpcStateSyncArgs = {
      type: 'entities-update',
      payload: {
        [type]: data
      },
      sourceWindowId: windowId,
      timestamp
    };
    
    electronIpcRenderer.invoke<[IpcStateSyncArgs], IpcStateSyncRes>(ipcStateSyncChannel, args);
  }, 300);
  
  // Check for changes and notify
  const checkAndNotifyChanges = () => {
    const currentProjects = getProjects();
    const currentWorkflows = getWorkflows();
    const currentWidgets = getWidgets();
    const currentApps = getApps();
    
    if (prevProjects !== currentProjects) {
      prevProjects = currentProjects;
      debouncedNotify('projects', currentProjects);
    }
    
    if (prevWorkflows !== currentWorkflows) {
      prevWorkflows = currentWorkflows;
      debouncedNotify('workflows', currentWorkflows);
    }
    
    if (prevWidgets !== currentWidgets) {
      prevWidgets = currentWidgets;
      debouncedNotify('widgets', currentWidgets);
    }
    
    if (prevApps !== currentApps) {
      prevApps = currentApps;
      debouncedNotify('apps', currentApps);
    }
  };
  
  // Handle incoming state sync events
  const handleStateSync = (_event: any, args: IpcStateSyncArgs) => {
    if (args.sourceWindowId === windowId) {
      // Ignore our own updates
      return;
    }
    
    // Handle app config updates
    if (args.type === 'app-config-update' && args.payload.appConfig) {
      const currentState = appStore.get();
      appStore.set({
        ...currentState,
        ui: {
          ...currentState.ui,
          appConfig: args.payload.appConfig
        }
      });
      return;
    }
    
    // Process each entity type in the payload
    if (args.payload.projects && (!lastUpdateTimestamps.has('projects') || args.timestamp > lastUpdateTimestamps.get('projects')!)) {
      lastUpdateTimestamps.set('projects', args.timestamp);
      setProjects(args.payload.projects);
    }
    
    if (args.payload.workflows && (!lastUpdateTimestamps.has('workflows') || args.timestamp > lastUpdateTimestamps.get('workflows')!)) {
      lastUpdateTimestamps.set('workflows', args.timestamp);
      setWorkflows(args.payload.workflows);
    }
    
    if (args.payload.widgets && (!lastUpdateTimestamps.has('widgets') || args.timestamp > lastUpdateTimestamps.get('widgets')!)) {
      lastUpdateTimestamps.set('widgets', args.timestamp);
      setWidgets(args.payload.widgets);
    }
    
    if (args.payload.apps && (!lastUpdateTimestamps.has('apps') || args.timestamp > lastUpdateTimestamps.get('apps')!)) {
      lastUpdateTimestamps.set('apps', args.timestamp);
      setApps(args.payload.apps);
    }
  };
  
  let isListening = false;
  let storeSubscriptionInterval: NodeJS.Timeout | null = null;
  
  return () => ({
    startSync: () => {
      if (!isListening) {
        // Listen for incoming sync events
        electronIpcRenderer.on(ipcStateSyncChannel, handleStateSync);
        isListening = true;
        
        // Initialize previous state
        prevProjects = getProjects();
        prevWorkflows = getWorkflows();
        prevWidgets = getWidgets();
        prevApps = getApps();
        
        // Start polling for state changes
        storeSubscriptionInterval = setInterval(checkAndNotifyChanges, 100);
      }
    },
    
    stopSync: () => {
      if (isListening) {
        electronIpcRenderer.removeListener(ipcStateSyncChannel, handleStateSync);
        isListening = false;
      }
      
      if (storeSubscriptionInterval) {
        clearInterval(storeSubscriptionInterval);
        storeSubscriptionInterval = null;
      }
    },
    
    notifyStateChange: (type: 'projects' | 'workflows' | 'widgets' | 'apps') => {
      let data: any;
      switch (type) {
        case 'projects':
          data = getProjects();
          break;
        case 'workflows':
          data = getWorkflows();
          break;
        case 'widgets':
          data = getWidgets();
          break;
        case 'apps':
          data = getApps();
          break;
      }
      
      if (data) {
        debouncedNotify(type, data);
      }
    }
  });
};

export type SyncStateEntitiesUseCase = ReturnType<typeof createSyncStateEntitiesUseCase>; 