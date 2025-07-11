/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { debounce } from '@/widgets/helpers';
import { ActionBar, ActionBarItems, ReactComponent, WidgetReactComponentProps, delete14Svg, moveItemInList } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createContextMenuFactory } from '@/widgets/to-do-list/contextMenu';
import { createActionBarItems } from '@/widgets/to-do-list/actionBar';
import clsx from 'clsx';
import { addItem, deleteItem, editItem, markComplete, markIncomplete } from '@/widgets/to-do-list/actions';
import { ActiveItemEditorState, ToDoListItem, ToDoListState, maxTextLength } from '@/widgets/to-do-list/state';
import { focusItemInput, scrollToItemInput, selectAllInItemInput } from '@/widgets/to-do-list/dom';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { ipcStateSyncChannel, IpcStateSyncArgs } from '@common/ipc/channels';

const dataKey = 'todo';

function WidgetComp({id, widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const addItemTopInputRef = useRef<HTMLInputElement>(null);
  const addItemBottomInputRef = useRef<HTMLInputElement>(null);
  const editItemInputRef = useRef<HTMLInputElement>(null);
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeItemEditorState, setActiveItemEditorState] = useState<ActiveItemEditorState>(null);
  const [toDoList, setToDoList] = useState<ToDoListState>({
    items: [],
    nextItemId: 1
  });
  const [dragState, setDragState] = useState<{
    draggingItemId: number | null;
    draggingOverItemId: number | null;
  } | null>(null);
  const widgetId = useRef(id);
  const lastSyncTimestamp = useRef(0);

  const getToDoList = useCallback(() => toDoList, [toDoList]);

  const saveData = useMemo(() => debounce((data: ToDoListState) => {
    lastSyncTimestamp.current = Date.now();
    dataStorage.setJson(dataKey, data);
  }, 3000), [dataStorage]);

  const loadData = useCallback(async function () {
    const loadedData = await dataStorage.getJson(dataKey) as ToDoListState|undefined;
    if (typeof loadedData === 'object' && loadedData && Array.isArray(loadedData.items) && typeof loadedData.nextItemId === 'number') {
      const sanitizedData: ToDoListState = {
        items: loadedData.items.map(({id, text, isDone }) => {
          if(typeof id === 'number' && typeof text === 'string' && typeof isDone === 'boolean') {
            return { id, text, isDone }
          } else {
            return undefined;
          }
        }).filter(item => item) as ToDoListItem[],
        nextItemId: loadedData.nextItemId
      }
      setToDoList(sanitizedData);
    }
    setIsLoaded(true);
  }, [dataStorage]);

  // Listen for sync updates from other windows
  useEffect(() => {
    const handleSync = (_event: any, args: IpcStateSyncArgs) => {
      if (args.type === 'widget-data-update' && args.payload.widgetId === widgetId.current) {
        const todoData = args.payload.widgetData?.[dataKey];
        if (todoData && args.timestamp > lastSyncTimestamp.current) {
          // Validate the incoming data
          if (typeof todoData === 'object' && todoData && Array.isArray(todoData.items) && typeof todoData.nextItemId === 'number') {
            const sanitizedData: ToDoListState = {
              items: todoData.items.map(({id, text, isDone }: any) => {
                if(typeof id === 'number' && typeof text === 'string' && typeof isDone === 'boolean') {
                  return { id, text, isDone }
                } else {
                  return undefined;
                }
              }).filter((item: any) => item) as ToDoListItem[],
              nextItemId: todoData.nextItemId
            }
            lastSyncTimestamp.current = args.timestamp;
            setToDoList(sanitizedData);
          }
        }
      }
    };

    electronIpcRenderer.on(ipcStateSyncChannel, handleSync);
    return () => {
      electronIpcRenderer.removeListener(ipcStateSyncChannel, handleSync);
    };
  }, []);

  useEffect(() => {
    if(!isLoaded) {
      loadData();
    }
  }, [isLoaded, loadData])

  const setToDoListAndSave = useCallback((toDoList: ToDoListState)=>{
    setToDoList(toDoList);
    saveData(toDoList);
  }, [saveData])

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(getToDoList, setToDoListAndSave, setActiveItemEditorState));
    }
  }, [getToDoList, isLoaded, setToDoListAndSave, updateActionBar]);

  useEffect(() => {
    if (isLoaded) {
      setContextMenuFactory(
        createContextMenuFactory(settings, getToDoList, setToDoListAndSave, setActiveItemEditorState)
        );
    }
  }, [getToDoList, isLoaded, setContextMenuFactory, setToDoListAndSave, settings]);

  useEffect(() => {
    if (activeItemEditorState!==null) {
      if (activeItemEditorState.id==='add-top' && addItemTopInputRef.current) {
        focusItemInput(addItemTopInputRef.current);
        scrollToItemInput(addItemTopInputRef.current);
      } else if (activeItemEditorState.id==='add-bottom' && addItemBottomInputRef.current) {
        focusItemInput(addItemBottomInputRef.current);
        scrollToItemInput(addItemBottomInputRef.current);
      } else if (editItemInputRef.current) {
        focusItemInput(editItemInputRef.current);
        selectAllInItemInput(editItemInputRef.current);
      }
    }
  }, [activeItemEditorState])

  const addItemInputBlurHandler = useCallback((e: React.FocusEvent<HTMLInputElement, Element>, isTop: boolean) => {
    addItem(e.target.value, isTop, getToDoList, setToDoListAndSave);
    e.target.value='';
    if(isTop) {
      setActiveItemEditorState(null);
    }
  }, [getToDoList, setToDoListAndSave])

  const addItemInputKeyDownHandler = useCallback((e: React.KeyboardEvent<HTMLInputElement>, isTop: boolean) => {
    if (e.key === 'Enter') {
      addItem((e.target as HTMLInputElement).value, isTop, getToDoList, setToDoListAndSave);
      (e.target as HTMLInputElement).value='';
      setActiveItemEditorState(isTop ? {id: 'add-top'} : {id: 'add-bottom'});
    } else if (e.key === 'Escape') {
      (e.target as HTMLInputElement).value='';
      setActiveItemEditorState(null);
    }
  }, [getToDoList, setToDoListAndSave])

  const editItemInputBlurHandler = useCallback((e: React.FocusEvent<HTMLInputElement, Element>, itemId: number) => {
    editItem(itemId, e.target.value, getToDoList, setToDoListAndSave);
    setActiveItemEditorState(null);
  }, [getToDoList, setToDoListAndSave])

  const editItemInputKeyDownHandler = useCallback((e: React.KeyboardEvent<HTMLInputElement>, itemId: number) => {
    if (e.key === 'Enter') {
      editItem(itemId, (e.target as HTMLInputElement).value, getToDoList, setToDoListAndSave);
      setActiveItemEditorState(null);
    } else if (e.key === 'Escape') {
      (e.target as HTMLInputElement).value='';
      setActiveItemEditorState(null);
    }
  }, [getToDoList, setToDoListAndSave])

  const createDoneActionBarItems: (itemId: number) => ActionBarItems = useCallback((itemId) => [{
    enabled: true,
    icon: delete14Svg,
    id: 'DELETE-ITEM',
    title: 'Delete Item',
    doAction: async () => {
      deleteItem(itemId, getToDoList, setToDoListAndSave);
    }
  }], [getToDoList, setToDoListAndSave])

  const itemDragStartHandler = useCallback((_evt: DragEvent<HTMLElement>, itemId: number) => {
    setDragState({
      draggingItemId: itemId,
      draggingOverItemId: null
    })
  }, [])

  const itemDragEndHandler = useCallback((_evt: DragEvent<HTMLElement>, _itemId: number) => {
    setDragState(null);
  }, [])

  const itemDragEnterHandler = useCallback((_evt: DragEvent<HTMLElement>, itemId: number) => {
    if (dragState) {
      setDragState({
        ...dragState,
        draggingOverItemId: itemId
      });
    }
  }, [dragState])

  const itemDragLeaveHandler = useCallback((_evt: DragEvent<HTMLElement>, _itemId: number) => {
    if (dragState) {
      setDragState({
        ...dragState,
        draggingOverItemId: null
      });
    }
  }, [dragState])

  const itemDragOverHandler = useCallback((evt: DragEvent<HTMLElement>, itemId: number) => {
    if (dragState !== null) {
      if (dragState.draggingOverItemId !== itemId) {
        setDragState({
          ...dragState,
          draggingOverItemId: itemId
        });
      }
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'move';
    }
  }, [dragState])

  const itemDropHandler = useCallback((_evt: DragEvent<HTMLElement>, itemId: number) => {
    if (dragState?.draggingItemId) {
      const { draggingItemId } = dragState;
      const sourceIdx = toDoList.items.findIndex(item => item.id === draggingItemId);
      const targetIdx = toDoList.items.findIndex(item => item.id === itemId);
      if (sourceIdx !== -1 && targetIdx !== -1) {
        setToDoListAndSave({
          ...toDoList,
          items: moveItemInList(toDoList.items, sourceIdx, targetIdx)
        })
      }
    }
  }, [dragState, toDoList, setToDoListAndSave])

  return (
    isLoaded
    ? <div className={styles['todo-list-viewport']} data-widget-context="">
        {activeItemEditorState?.id==='add-top' && <input
          type="text"
          placeholder="Add an item"
          ref={addItemTopInputRef}
          className={clsx(styles['todo-list-item-editor'], styles['todo-list-add-item-editor'])}
          onBlur={e=>addItemInputBlurHandler(e, true)}
          onKeyDown={e=>addItemInputKeyDownHandler(e, true)}
          maxLength={maxTextLength}
        />}
        <ul
          className={clsx(styles['todo-list'], dragState && styles['is-drag-state'])}
        >
          {toDoList.items.map(item=>(
            <li
              key={item.id}
              className={clsx(styles['todo-list-item'], item.isDone && styles['is-done'], activeItemEditorState?.id === item.id && styles['is-editor'], dragState?.draggingOverItemId===item.id && styles['is-drop-area'])}
              data-widget-context={item.id}
              draggable={true}
              onDragStart={e=>itemDragStartHandler(e, item.id)}
              onDragEnd={e=>itemDragEndHandler(e, item.id)}
              onDragEnter={e=>itemDragEnterHandler(e, item.id)}
              onDragLeave={e=>itemDragLeaveHandler(e, item.id)}
              onDragOver={e=>itemDragOverHandler(e, item.id)}
              onDrop={e=>itemDropHandler(e, item.id)}
            >
              <label title={item.text}>
                <span>
                  <input
                    type='checkbox'
                    checked={item.isDone}
                    onChange={
                      _ => item.isDone
                        ? markIncomplete(item.id, getToDoList, setToDoListAndSave)
                        : markComplete(item.id, settings.doneToBottom, getToDoList, setToDoListAndSave)
                    }/>
                </span>
                {activeItemEditorState?.id === item.id
                  ? <input
                      type="text"
                      ref={editItemInputRef}
                      className={clsx(styles['todo-list-item-editor'], styles['todo-list-edit-item-editor'])}
                      onBlur={e => editItemInputBlurHandler(e, item.id)}
                      onKeyDown={e => editItemInputKeyDownHandler(e, item.id)}
                      defaultValue={item.text}
                      maxLength={maxTextLength}
                    />
                  : <span>{item.text}</span>
                }
              </label>
              {item.isDone &&
                <ActionBar
                  actionBarItems={createDoneActionBarItems(item.id)}
                  className={styles['done-item-actionbar']}
                ></ActionBar>
              }
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Add an item"
          ref={addItemBottomInputRef}
          className={clsx(styles['todo-list-item-editor'], styles['todo-list-add-item-editor'])}
          onBlur={e=>addItemInputBlurHandler(e, false)}
          onKeyDown={e=>addItemInputKeyDownHandler(e, false)}
          maxLength={maxTextLength}
        />
      </div>
    : <>Loading To-Do List...</>
  )
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
