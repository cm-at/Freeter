/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import styles from './widget.module.scss';

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

function WidgetComp({id, settings, widgetApi, env}: WidgetReactComponentProps<Settings>) {
  console.log('[TerminalWidget] Rendering terminal widget:', { id, settings, hasWidgetApi: !!widgetApi });
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const ptyIdRef = useRef<number | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // In preview mode (settings editor), don't show controls
  const showControls = !env.isPreview;

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
    
    console.log('[TerminalWidget] Calling createTerminal with shell:', shellPath);
    terminalApi.createTerminal(id, shellPath, settings.cwd)
    .then(({ ptyId }) => {
      console.log('[TerminalWidget] Terminal created successfully with ptyId:', ptyId);
      ptyIdRef.current = ptyId;
      
      console.log('[TerminalWidget] Setting up onData handler');
      term.onData(data => {
        console.log('[TerminalWidget] Terminal data input:', data);
        terminalApi.writeToTerminal(ptyId, String(data));
      });

      // Set up data listener
      console.log('[TerminalWidget] Registering data handler');
      const dataHandler = (pid: number, data: string) => {
        console.log('[TerminalWidget] Data handler called:', { pid, ptyId, data });
        if (pid === ptyId) {
          console.log('[TerminalWidget] Writing data to terminal display');
          term.write(String(data));
        } else {
          console.log('[TerminalWidget] Ignoring data for different pid:', pid);
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

    console.log('[TerminalWidget] Creating Terminal instance');
    const term = new Terminal({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: themes[settings.theme] || themes.dark,
      cursorBlink: true
    });
    xtermRef.current = term;
    
    console.log('[TerminalWidget] Opening terminal in DOM element');
    term.open(terminalRef.current);
    
    // Set up fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;
    fitAddon.fit();
    
    createTerminal();

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      console.log('[TerminalWidget] Cleanup function called');
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