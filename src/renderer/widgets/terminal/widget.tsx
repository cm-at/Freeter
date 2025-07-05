/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import styles from './widget.module.scss';
import { TerminalProvider } from '@/application/interfaces/terminalProvider';

// Terminal session data that should be persisted
interface TerminalSession {
  env?: Record<string, string>;
  cwd?: string;
  history?: string[];
  scrollback?: string;
}

const themes = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
  },
  light: {
    background: '#ffffff',
    foreground: '#333333',
    black: '#000000',
    red: '#cd3131',
    green: '#00bc00',
    yellow: '#949800',
    blue: '#0451a5',
    magenta: '#bc05bc',
    cyan: '#0598bc',
    white: '#555555',
    brightBlack: '#666666',
    brightRed: '#cd3131',
    brightGreen: '#14ce14',
    brightYellow: '#b5ba00',
    brightBlue: '#0451a5',
    brightMagenta: '#bc05bc',
    brightCyan: '#0598bc',
    brightWhite: '#a5a5a5'
  },
  monokai: {
    background: '#272822',
    foreground: '#f8f8f2',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#75715e',
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5'
  },
  'solarized-dark': {
    background: '#002b36',
    foreground: '#839496',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3'
  },
  'solarized-light': {
    background: '#fdf6e3',
    foreground: '#657b83',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3'
  },
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff'
  }
};

type Unsubscribe = () => void;

function WidgetComp({id, settings, widgetApi, env}: WidgetReactComponentProps<Settings>) {
  console.log('[TerminalWidget] Component initialized with settings:', settings);
  console.log('[TerminalWidget] Widget ID:', id);
  console.log('[TerminalWidget] Widget API available:', !!widgetApi);
  console.log('[TerminalWidget] dataStorage available:', !!widgetApi?.dataStorage);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<number | null>(null);
  const sessionLoadedRef = useRef(false);
  const [sessionData, setSessionData] = useState<TerminalSession>({
    env: {},
    cwd: '',
    history: [],
    scrollback: ''
  });

  // In preview mode (settings editor), don't show controls
  const showControls = !env.isPreview;

  // Load session data when component mounts
  const loadSessionData = async () => {
    if (!widgetApi?.dataStorage) {
      console.log('[TerminalWidget] No dataStorage API available, skipping session load');
      sessionLoadedRef.current = true;
      return;
    }
    
    try {
      const storageKey = `terminal-session-${id}`;
      console.log('[TerminalWidget] Loading session data for widget:', id, 'with key:', storageKey);
      const savedSession = await widgetApi.dataStorage.getJson(storageKey) as TerminalSession | undefined;
      console.log('[TerminalWidget] Loaded session data:', savedSession);
      if (savedSession) {
        setSessionData(savedSession);
      }
      sessionLoadedRef.current = true;
    } catch (error) {
      console.error('[TerminalWidget] Failed to load session data:', error);
      sessionLoadedRef.current = true;
    }
  };
  
  const saveSessionData = async (data: Partial<TerminalSession>) => {
    if (!widgetApi?.dataStorage) {
      console.log('[TerminalWidget] No dataStorage API available, skipping session save');
      return;
    }
    
    try {
      const newSessionData = { ...sessionData, ...data };
      const storageKey = `terminal-session-${id}`;
      console.log('[TerminalWidget] Saving session data with key:', storageKey, 'data:', newSessionData);
      await widgetApi.dataStorage.setJson(storageKey, newSessionData);
      setSessionData(newSessionData);
    } catch (error) {
      console.error('[TerminalWidget] Failed to save session data:', error);
    }
  };

  // Save current working directory when it changes
  const updateCwd = useCallback((newCwd: string) => {
    saveSessionData({ cwd: newCwd });
  }, [saveSessionData]);

  // Save scrollback buffer periodically
  const saveScrollback = useCallback(() => {
    if (!xtermRef.current) return;
    
    const buffer = xtermRef.current.buffer.active;
    const lines: string[] = [];
    
    // Get last 1000 lines of scrollback
    const startLine = Math.max(0, buffer.length - 1000);
    for (let i = startLine; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        lines.push(line.translateToString());
      }
    }
    
    saveSessionData({ scrollback: lines.join('\n') });
  }, [saveSessionData]);

  const handleRefresh = () => {
    if (ptyIdRef.current && widgetApi) {
      console.log('[TerminalWidget] Refreshing terminal');
      // Close current terminal
      widgetApi.terminal.closeTerminal(ptyIdRef.current);
      // Clear the display
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
      // Create new terminal
      createTerminal();
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      console.log('[TerminalWidget] Clearing terminal');
      xtermRef.current.clear();
    }
  };

  const handleFit = () => {
    if (fitAddonRef.current) {
      console.log('[TerminalWidget] Fitting terminal');
      fitAddonRef.current.fit();
    }
  };

  const createTerminal = () => {
    if (!widgetApi || !xtermRef.current) return;
    
    const term = xtermRef.current;
    const terminalApi = widgetApi.terminal;
    
    // Use the shell from settings, considering shellType
    const shellPath = settings.shellType === 'custom' || settings.shellType === 'default' 
      ? settings.shell 
      : settings.shell || '';
    
    // Use saved cwd if available, otherwise use settings cwd
    const initialCwd = sessionData.cwd || settings.cwd;
    
    console.log('[TerminalWidget] Calling createTerminal with shell:', shellPath, 'cwd:', initialCwd);
    terminalApi.createTerminal(id, shellPath, initialCwd)
    .then(({ ptyId }) => {
      console.log('[TerminalWidget] Terminal created successfully with ptyId:', ptyId);
      
      // Check if we got a valid ptyId
      if (ptyId < 0) {
        console.error('[TerminalWidget] Invalid ptyId received:', ptyId);
        term.writeln('\r\n[Failed to create terminal - invalid shell or directory]');
        term.writeln('\r\nPlease check your terminal settings.');
        return;
      }
      
      ptyIdRef.current = ptyId;
      
      // Restore scrollback if available (but don't block on it)
      if (sessionData.scrollback && sessionData.scrollback.trim()) {
        try {
          term.write(sessionData.scrollback);
          term.write('\r\n');
        } catch (e) {
          console.error('[TerminalWidget] Failed to restore scrollback:', e);
        }
      }
      
      console.log('[TerminalWidget] Setting up onData handler');
      term.onData(data => {
        console.log('[TerminalWidget] Terminal data input:', data);
        terminalApi.writeToTerminal(ptyId, String(data));
      });

      // Set up data listener
      console.log('[TerminalWidget] Registering data handler');
      const dataHandler = (pid: number, data: string) => {
        if (pid === ptyId) {
          term.write(String(data));
        }
      };
      terminalApi.onTerminalData(dataHandler);

      // Set up exit listener
      console.log('[TerminalWidget] Registering exit handler');
      const exitHandler = (pid: number) => {
        console.log('[TerminalWidget] Exit handler called:', { pid, ptyId });
        if (pid === ptyId) {
          console.log('[TerminalWidget] Terminal process terminated');
          term.writeln('\r\n[Process terminated]');
        }
      };
      terminalApi.onTerminalExit(exitHandler);
      
      console.log('[TerminalWidget] All handlers registered');
      
      // Execute auto start command if configured
      if (settings.autoStartCommand && settings.autoStartCommand.trim()) {
        console.log('[TerminalWidget] Executing auto start command:', settings.autoStartCommand);
        // Add a small delay to ensure terminal is fully initialized
        setTimeout(() => {
          terminalApi.writeToTerminal(ptyId, settings.autoStartCommand.trim() + '\n');
        }, 100);
      }
      
      // Set up periodic scrollback saving (but don't let it interfere with operation)
      if (widgetApi.dataStorage) {
        const scrollbackInterval = setInterval(() => {
          try {
            saveScrollback();
          } catch (e) {
            console.error('[TerminalWidget] Failed to save scrollback:', e);
          }
        }, 30000); // Save every 30 seconds
        
        // Store interval ID for cleanup
        (window as any)[`terminal-scrollback-${id}`] = scrollbackInterval;
      }
    })
    .catch((error) => {
      console.error('[TerminalWidget] Failed to create terminal:', error);
      term.writeln('\r\n[Terminal backend unavailable]\r\n');
      term.write('$ ');
    });
  };

  useEffect(() => {
    console.log('[TerminalWidget] Main useEffect triggered');
    console.log('[TerminalWidget] terminalRef.current:', !!terminalRef.current);
    console.log('[TerminalWidget] widgetApi:', !!widgetApi);
    console.log('[TerminalWidget] widgetApi.terminal:', widgetApi?.terminal);
    
    if (!terminalRef.current || !widgetApi) {
      console.warn('[TerminalWidget] Missing dependencies, returning early');
      return;
    }

    const term = new Terminal({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: themes[settings.theme] || themes.dark,
      cursorBlink: true,
      scrollback: 10000 // Increase scrollback buffer
    });
    xtermRef.current = term;
    
    console.log('[TerminalWidget] Opening terminal in DOM element');
    term.open(terminalRef.current);
    
    // Set up fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;
    fitAddon.fit();
    
    // Load session data asynchronously without blocking terminal creation
    loadSessionData().then(() => {
      console.log('[TerminalWidget] Session data loaded, creating terminal');
      createTerminal();
    }).catch((error) => {
      console.error('[TerminalWidget] Failed to load session data, creating terminal anyway:', error);
      createTerminal();
    });

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      console.log('[TerminalWidget] Cleanup function called');
      
      // Save final scrollback before cleanup
      if (widgetApi?.dataStorage) {
        saveScrollback();
      }
      
      // Clear scrollback interval
      const intervalId = (window as any)[`terminal-scrollback-${id}`];
      if (intervalId) {
        clearInterval(intervalId);
        delete (window as any)[`terminal-scrollback-${id}`];
      }
      
      resizeObserver.disconnect();
      if (ptyIdRef.current !== null) {
        console.log('[TerminalWidget] Closing terminal with ptyId:', ptyIdRef.current);
        const terminalApi = widgetApi.terminal;
        terminalApi.closeTerminal(ptyIdRef.current);
      }
      console.log('[TerminalWidget] Disposing xterm instance');
      term.dispose();
    };
  }, [widgetApi, id, settings.shell, settings.shellType, settings.cwd, settings.autoStartCommand]);

  // Update terminal settings when they change
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = settings.fontSize;
      xtermRef.current.options.fontFamily = settings.fontFamily;
      xtermRef.current.options.theme = themes[settings.theme] || themes.dark;
    }
  }, [settings.fontSize, settings.fontFamily, settings.theme]);

  return (
    <div className={styles.terminal}>
      {showControls && (
        <div className={styles.controls}>
          <button 
            className={styles.controlButton} 
            onClick={handleRefresh}
            title="Restart Terminal"
          >
            ↻
          </button>
          <button 
            className={styles.controlButton} 
            onClick={handleClear}
            title="Clear Terminal"
          >
            ⌫
          </button>
          <button 
            className={styles.controlButton} 
            onClick={handleFit}
            title="Fit Terminal"
          >
            ⊡
          </button>
        </div>
      )}
      <div ref={terminalRef} className={styles.terminalContainer}></div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}