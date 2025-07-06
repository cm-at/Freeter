/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { debounce } from '@/widgets/helpers';
import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createContextMenuFactory, textAreaContextId } from '@/widgets/note/contextMenu';
import { createActionBarItems } from '@/widgets/note/actionBar';
import { Editor } from 'tiny-markdown-editor';
import { electronIpcRenderer } from '@/infra/mainApi/mainApi';
import { ipcStateSyncChannel, IpcStateSyncArgs } from '@common/ipc/channels';

const keyNote = 'note';

function WidgetComp({id, widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const loadedNote = useRef('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const tinyMDERef = useRef<Editor | null>(null);
  const widgetId = useRef(id);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(textAreaRef.current, widgetApi));
      setContextMenuFactory(createContextMenuFactory(textAreaRef.current, widgetApi));
    }
  }, [isLoaded, updateActionBar, setContextMenuFactory, widgetApi]);

  const saveNote = useMemo(() => debounce((note: string) => dataStorage.setText(keyNote, note), 3000), [dataStorage]);
  const updNote = useCallback((note: string) => {
    loadedNote.current = note;
    setNoteContent(note);
    saveNote(note);
  }, [saveNote])

  const loadNote = useCallback(async function () {
    loadedNote.current = await dataStorage.getText(keyNote) || '';
    setNoteContent(loadedNote.current);
    setIsLoaded(true);
  }, [dataStorage]);

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((e) => {
    const newNote = e.target.value;
    updNote(newNote)
  }, [updNote])

  // Listen for sync updates from other windows
  useEffect(() => {
    const handleSync = (_event: any, args: IpcStateSyncArgs) => {
      if (args.type === 'widget-data-update' && args.payload.widgetId === widgetId.current) {
        const noteValue = args.payload.widgetData?.[keyNote];
        if (noteValue !== undefined && noteValue !== loadedNote.current) {
          loadedNote.current = noteValue;
          setNoteContent(noteValue);
          
          // Update the textarea or TinyMDE editor
          if (textAreaRef.current && !settings.markdown) {
            textAreaRef.current.value = noteValue;
          } else if (tinyMDERef.current && settings.markdown) {
            tinyMDERef.current.setContent(noteValue);
          }
        }
      }
    };

    electronIpcRenderer.on(ipcStateSyncChannel, handleSync);
    return () => {
      electronIpcRenderer.removeListener(ipcStateSyncChannel, handleSync);
    };
  }, [settings.markdown]);

  useEffect(() => {
    loadNote();
  }, [loadNote])

  useEffect(() => {
    if (textAreaRef.current) {
      if (settings.markdown) {
        const tinyMDE = new Editor({textarea: textAreaRef.current});
        tinyMDE.addEventListener('change', (e) => updNote(e.content));
        (textAreaRef.current.nextSibling as HTMLElement).spellcheck = settings.spellCheck;
        tinyMDERef.current = tinyMDE;
      } else {
        tinyMDERef.current = null;
        loadedNote.current = textAreaRef.current.value;
        Array.from(textAreaRef.current.parentElement?.children || [])
          .filter(child => child.classList.contains('TinyMDE'))
          .forEach(child => child.remove());
      }
    }
  })

  return (
    isLoaded
    ? <textarea
        key={settings.markdown?'md':undefined} // resets element after disabling markdown
        ref={textAreaRef}
        className={styles['textarea']}
        defaultValue={noteContent}
        onChange={handleChange}
        placeholder='Write a note here'
        data-widget-context={textAreaContextId}
        spellCheck={settings.spellCheck}
      ></textarea>
    : <>Loading Note...</>
  )
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
