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
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode by default
  const [markdownPreview, setMarkdownPreview] = useState('');
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const tinyMDERef = useRef<Editor | null>(null);
  const widgetId = useRef(id);
  const isUpdatingRef = useRef(false);
  const lastKeyPressRef = useRef<number>(0);

  // Throttle markdown parsing to avoid excessive memory usage
  const parseMarkdown = useMemo(() => 
    debounce(async (content: string) => {
      if (!settings.markdown || !content) {
        setMarkdownPreview('');
        return;
      }
      
      try {
        const html = await marked(content);
        setMarkdownPreview(html);
        setMarkdownError(null);
      } catch (error) {
        setMarkdownError(error instanceof Error ? error.message : 'Failed to parse markdown');
        setMarkdownPreview('');
      }
    }, 500), // Increased debounce time to reduce parsing frequency
    [settings.markdown]
  );

  // Update refs when values change
  useEffect(() => {
    // settingsRef.current = settings; // Removed as per new_code
  }, [settings]);

  useEffect(() => {
    // noteContentRef.current = noteContent; // Removed as per new_code
  }, [noteContent]);

  useEffect(() => {
    // markdownPreviewRef.current = markdownPreview; // Removed as per new_code
  }, [markdownPreview]);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(textAreaRef.current, widgetApi));
      setContextMenuFactory(createContextMenuFactory(textAreaRef.current, widgetApi));
    }
  }, [isLoaded, updateActionBar, setContextMenuFactory, widgetApi]);

  const saveNote = useMemo(() => debounce((note: string) => dataStorage.setText(keyNote, note), 3000), [dataStorage]);
  const updNote = useCallback(async (note: string) => {
    isUpdatingRef.current = true;
    loadedNote.current = note;
    setNoteContent(note);
    saveNote(note);
    
    // Throttled markdown parsing
    parseMarkdown(note);
    
    // Reset updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [saveNote, parseMarkdown])

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
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay to ensure any final changes are captured
    setTimeout(() => {
      // Don't blur if we're in the middle of updating
      if (isUpdatingRef.current) {
        return;
      }
      
      // Don't blur if we just pressed a key (within 200ms)
      if (Date.now() - lastKeyPressRef.current < 200) {
        return;
      }
      
      // Check if focus is still within the editor elements
      const activeElement = document.activeElement;
      const editorContainer = textAreaRef.current?.parentElement;
      const tinyMDEEditor = textAreaRef.current?.nextSibling as HTMLElement;
      
      // Check if focus is still within any editor-related element
      if (activeElement && (
        activeElement === textAreaRef.current ||
        editorContainer?.contains(activeElement) ||
        tinyMDEEditor?.contains(activeElement)
      )) {
        return;
      }
      
      setIsEditing(false);
    }, 100);
  }, []);

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
            parseMarkdown(noteValue);
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
  }, [settings.markdown, parseMarkdown]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  useEffect(() => {
    if (textAreaRef.current && settings.markdown) {
      // Clean up any existing TinyMDE instance first
      if (tinyMDERef.current) {
        // Manual cleanup - remove TinyMDE DOM elements
        const existingEditor = textAreaRef.current.nextSibling as HTMLElement;
        if (existingEditor && existingEditor.classList?.contains('TinyMDE')) {
          existingEditor.remove();
        }
        tinyMDERef.current = null;
      }
      
      const tinyMDE = new Editor({textarea: textAreaRef.current});
      tinyMDE.addEventListener('change', (e) => updNote(e.content));
      
      // Store cleanup functions
      const cleanupFunctions: (() => void)[] = [];
      
      // TinyMDE creates its editor as the next sibling
      const editorElement = textAreaRef.current.nextSibling as HTMLElement;
      if (editorElement) {
        editorElement.spellcheck = settings.spellCheck;
        
        // Set contentEditable to make sure events work properly
        editorElement.setAttribute('contenteditable', 'true');
        
        // Add keyboard handler for better list and checkbox support
        const keyDownHandler = (event: KeyboardEvent) => {
          // Track key press time to prevent blur on typing
          lastKeyPressRef.current = Date.now();
          
          if (event.key === 'Enter') {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const startContainer = range.startContainer;
            const currentLine = startContainer.textContent || '';
            
            // Check if we're at the end of a list item
            if (range.collapsed && range.startOffset === currentLine.length) {
              // Check for checkbox pattern
              const checkboxMatch = currentLine.match(/^(\s*)([-*+])\s+\[([ xX])\]\s*(.*)$/);
              if (checkboxMatch) {
                const [, indent, marker, , text] = checkboxMatch;
                
                // If empty checkbox item, remove it and exit list
                if (!text.trim()) {
                  event.preventDefault();
                  return;
                }
                
                // Insert new checkbox item
                event.preventDefault();
                document.execCommand('insertHTML', false, `\n${indent}${marker} [ ] `);
                return;
              }
              
              // Check for regular list pattern
              const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
              if (listMatch) {
                const [, indent, marker, text] = listMatch;
                
                // If empty list item, remove it and exit list
                if (!text.trim()) {
                  event.preventDefault();
                  return;
                }
                
                // Insert new list item
                event.preventDefault();
                let newMarker = marker;
                // Handle numbered lists
                if (/^\d+\./.test(marker)) {
                  const num = parseInt(marker) + 1;
                  newMarker = `${num}.`;
                }
                document.execCommand('insertHTML', false, `\n${indent}${newMarker} `);
                return;
              }
            }
          } else if (event.key === 'Tab') {
            // Handle indentation
            event.preventDefault();
            if (event.shiftKey) {
              // Decrease indent
              document.execCommand('outdent', false);
            } else {
              // Increase indent
              document.execCommand('insertHTML', false, '    '); // 4 spaces
            }
          } else if (event.key === 'c' && (event.metaKey || event.ctrlKey) && event.shiftKey) {
            // Cmd/Ctrl+Shift+C to insert checkbox
            event.preventDefault();
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const startContainer = range.startContainer;
            const currentLine = startContainer.textContent || '';
            
            // Check if we're at the beginning of a line or after whitespace
            const beforeCursor = currentLine.substring(0, range.startOffset);
            if (beforeCursor.match(/^\s*$/)) {
              // Insert checkbox at the beginning of the line
              document.execCommand('insertHTML', false, '- [ ] ');
            } else {
              // Insert inline checkbox
              document.execCommand('insertHTML', false, ' - [ ] ');
            }
          }
        };
        
        // Add keyup handler to track key release as well
        const keyUpHandler = () => {
          lastKeyPressRef.current = Date.now();
        };

        editorElement.addEventListener('keydown', keyDownHandler);
        editorElement.addEventListener('keyup', keyUpHandler);
        cleanupFunctions.push(() => {
          editorElement.removeEventListener('keydown', keyDownHandler);
          editorElement.removeEventListener('keyup', keyUpHandler);
        });
        
        // Add focus/blur listeners with capture phase to ensure they fire
        editorElement.addEventListener('focusin', handleFocus, true);
        editorElement.addEventListener('focusout', handleBlur, true);
        cleanupFunctions.push(() => {
          editorElement.removeEventListener('focusin', handleFocus, true);
          editorElement.removeEventListener('focusout', handleBlur, true);
        });
        
        // Also try adding to the contenteditable div inside TinyMDE
        const contentDiv = editorElement.querySelector('[contenteditable]') as HTMLElement;
        if (contentDiv && contentDiv !== editorElement) {
          contentDiv.addEventListener('focus', handleFocus);
          contentDiv.addEventListener('blur', handleBlur);
          contentDiv.addEventListener('keydown', keyDownHandler);
          contentDiv.addEventListener('keyup', keyUpHandler);
          cleanupFunctions.push(() => {
            contentDiv.removeEventListener('focus', handleFocus);
            contentDiv.removeEventListener('blur', handleBlur);
            contentDiv.removeEventListener('keydown', keyDownHandler);
            contentDiv.removeEventListener('keyup', keyUpHandler);
          });
        }
      }
      
      tinyMDERef.current = tinyMDE;
      
      // Return cleanup function
      return () => {
        // Execute all cleanup functions
        cleanupFunctions.forEach(fn => fn());
        
        // Clean up TinyMDE instance
        if (tinyMDERef.current) {
          // Manual cleanup - remove TinyMDE DOM elements
          const editorElement = textAreaRef.current?.nextSibling as HTMLElement;
          if (editorElement && editorElement.classList?.contains('TinyMDE')) {
            editorElement.remove();
          }
          tinyMDERef.current = null;
        }
      };
    } else if (textAreaRef.current && !settings.markdown) {
      // Plain text mode - clean up any existing TinyMDE
      if (tinyMDERef.current) {
        // Manual cleanup - remove TinyMDE DOM elements
        const existingEditor = textAreaRef.current.nextSibling as HTMLElement;
        if (existingEditor && existingEditor.classList?.contains('TinyMDE')) {
          existingEditor.remove();
        }
        tinyMDERef.current = null;
      }
      
      // Clean up any leftover TinyMDE elements
      const tinyMDEElements = textAreaRef.current.parentElement?.querySelectorAll('.TinyMDE');
      tinyMDEElements?.forEach(el => el.remove());
    }
  }, [settings.markdown, settings.spellCheck, updNote, handleFocus, handleBlur]);

  if (!isLoaded) {
    return <>Loading Note...</>;
  }

  // Show preview when markdown is enabled and not editing
  if (settings.markdown && !isEditing && noteContent) { // Only show preview if there's content
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
      placeholder={settings.markdown ? 'Write a note here...\n\nKeyboard shortcuts:\n• Cmd/Ctrl+Shift+C: Insert checkbox\n• Tab/Shift+Tab: Indent/outdent\n• Enter after list item: Continue list' : 'Write a note here'}
      data-widget-context={textAreaContextId}
      spellCheck={settings.spellCheck}
    ></textarea>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
