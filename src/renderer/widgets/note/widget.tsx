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
import { marked } from 'marked';

const keyNote = 'note';

// Configure marked options for better security and rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false
});

function WidgetComp({id, widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const loadedNote = useRef('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState('');
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const tinyMDERef = useRef<Editor | null>(null);
  const widgetId = useRef(id);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(textAreaRef.current, widgetApi));
      setContextMenuFactory(createContextMenuFactory(textAreaRef.current, widgetApi));
    }
  }, [isLoaded, updateActionBar, setContextMenuFactory, widgetApi]);

  const saveNote = useMemo(() => debounce((note: string) => dataStorage.setText(keyNote, note), 3000), [dataStorage]);
  const updNote = useCallback(async (note: string) => {
    loadedNote.current = note;
    setNoteContent(note);
    saveNote(note);
    
    // Update preview if in markdown mode
    if (settings.markdown) {
      try {
        const html = await marked(note);
        setMarkdownPreview(html);
        setMarkdownError(null);
      } catch (error) {
        setMarkdownError(error instanceof Error ? error.message : 'Failed to parse markdown');
      }
    }
  }, [saveNote, settings.markdown])

  const loadNote = useCallback(async function () {
    loadedNote.current = await dataStorage.getText(keyNote) || '';
    setNoteContent(loadedNote.current);
    
    // Generate initial preview if in markdown mode
    if (settings.markdown && loadedNote.current) {
      try {
        const html = await marked(loadedNote.current);
        setMarkdownPreview(html);
        setMarkdownError(null);
      } catch (error) {
        setMarkdownError(error instanceof Error ? error.message : 'Failed to parse markdown');
      }
    }
    
    setIsLoaded(true);
  }, [dataStorage, settings.markdown]);

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((e) => {
    const newNote = e.target.value;
    updNote(newNote)
  }, [updNote])

  const handleFocus = useCallback(() => {
    console.log('Note focus - entering edit mode');
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay to ensure any final changes are captured
    setTimeout(() => {
      console.log('Note blur - switching to preview mode, markdown enabled:', settings.markdown);
      console.log('Current note content:', noteContent?.substring(0, 100));
      console.log('Current preview:', markdownPreview?.substring(0, 100));
      setIsEditing(false);
    }, 100);
  }, [settings.markdown, noteContent, markdownPreview]);

  const handlePreviewClick = useCallback(() => {
    setIsEditing(true);
    // Focus the textarea after a small delay to ensure the editor is ready
    setTimeout(() => {
      if (settings.markdown && tinyMDERef.current) {
        // Focus the TinyMDE editor
        const editorElement = textAreaRef.current?.nextSibling as HTMLElement;
        if (editorElement) {
          editorElement.focus();
        }
      } else if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }, 50);
  }, [settings.markdown]);

  // Listen for sync updates from other windows
  useEffect(() => {
    const handleSync = (_event: any, args: IpcStateSyncArgs) => {
      if (args.type === 'widget-data-update' && args.payload.widgetId === widgetId.current) {
        const noteValue = args.payload.widgetData?.[keyNote];
        if (noteValue !== undefined && noteValue !== loadedNote.current) {
          loadedNote.current = noteValue;
          setNoteContent(noteValue);
          
          // Update preview
          if (settings.markdown) {
            Promise.resolve(marked(noteValue)).then((html: string) => {
              setMarkdownPreview(html);
              setMarkdownError(null);
            }).catch((error: any) => {
              setMarkdownError(error instanceof Error ? error.message : 'Failed to parse markdown');
            });
          }
          
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
    if (textAreaRef.current && settings.markdown) {
      const tinyMDE = new Editor({textarea: textAreaRef.current});
      tinyMDE.addEventListener('change', (e) => updNote(e.content));
      
      // TinyMDE creates its editor as the next sibling
      const editorElement = textAreaRef.current.nextSibling as HTMLElement;
      if (editorElement) {
        editorElement.spellcheck = settings.spellCheck;
        console.log('TinyMDE editor element found:', editorElement.className);
        
        // Set contentEditable to make sure events work properly
        editorElement.setAttribute('contenteditable', 'true');
        
        // Add focus/blur listeners with capture phase to ensure they fire
        editorElement.addEventListener('focusin', handleFocus, true);
        editorElement.addEventListener('focusout', handleBlur, true);
        
        // Also try adding to the contenteditable div inside TinyMDE
        const contentDiv = editorElement.querySelector('[contenteditable]') as HTMLElement;
        if (contentDiv && contentDiv !== editorElement) {
          console.log('Found inner contenteditable div');
          contentDiv.addEventListener('focus', handleFocus);
          contentDiv.addEventListener('blur', handleBlur);
        }
      } else {
        console.warn('Could not find TinyMDE editor element');
      }
      
      tinyMDERef.current = tinyMDE;
      
      // Return cleanup function
      return () => {
        if (editorElement) {
          editorElement.removeEventListener('focusin', handleFocus, true);
          editorElement.removeEventListener('focusout', handleBlur, true);
          const contentDiv = editorElement.querySelector('[contenteditable]') as HTMLElement;
          if (contentDiv && contentDiv !== editorElement) {
            contentDiv.removeEventListener('focus', handleFocus);
            contentDiv.removeEventListener('blur', handleBlur);
          }
        }
        // Clean up TinyMDE when unmounting or switching to plain text
        if (tinyMDERef.current) {
          tinyMDERef.current = null;
        }
      };
    } else if (textAreaRef.current && !settings.markdown) {
      // Plain text mode - clean up any existing TinyMDE
      tinyMDERef.current = null;
      loadedNote.current = textAreaRef.current.value;
      Array.from(textAreaRef.current.parentElement?.children || [])
        .filter(child => child.classList.contains('TinyMDE'))
        .forEach(child => child.remove());
    }
  }, [settings.markdown, settings.spellCheck, handleFocus, handleBlur, updNote])

  if (!isLoaded) {
    return <>Loading Note...</>;
  }

  console.log('Note render - markdown:', settings.markdown, 'isEditing:', isEditing, 'preview:', markdownPreview?.substring(0, 50));

  // Show preview when markdown is enabled and not editing
  if (settings.markdown && !isEditing) {
    console.log('Showing preview mode, markdownPreview length:', markdownPreview?.length);
    console.log('Preview HTML:', markdownPreview);
    
    return (
      <div className={styles['preview-container']} onClick={handlePreviewClick}>
        {markdownError ? (
          <div className={styles['preview-error']}>
            <h3>Markdown Error</h3>
            <p>{markdownError}</p>
          </div>
        ) : !markdownPreview ? (
          <div className={styles['preview']}>
            <p style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to edit...</p>
          </div>
        ) : (
          <div 
            ref={previewRef}
            className={styles['preview']}
            dangerouslySetInnerHTML={{ __html: markdownPreview }}
          />
        )}
      </div>
    );
  }

  // Show editor
  return (
    <textarea
      key={settings.markdown?'md':undefined} // resets element after disabling markdown
      ref={textAreaRef}
      className={styles['textarea']}
      defaultValue={noteContent}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder='Write a note here'
      data-widget-context={textAreaContextId}
      spellCheck={settings.spellCheck}
    ></textarea>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
