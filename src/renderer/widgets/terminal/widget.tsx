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

const darkTheme = {
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
};

const lightTheme = {
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
};

function WidgetComp({id, settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  console.log('[TerminalWidget] Rendering terminal widget:', { id, settings, hasWidgetApi: !!widgetApi });
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const ptyIdRef = useRef<number | null>(null);

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
      theme: settings.theme === 'dark' ? darkTheme : lightTheme,
      cursorBlink: true
    });
    xtermRef.current = term;
    
    console.log('[TerminalWidget] Opening terminal in DOM element');
    term.open(terminalRef.current);
    
    console.log('[TerminalWidget] Getting terminal API from widget API');
    const terminalApi = widgetApi.terminal;
    console.log('[TerminalWidget] Terminal API methods:', Object.keys(terminalApi));
    
    console.log('[TerminalWidget] Calling createTerminal');
    terminalApi.createTerminal(id, settings.shell, settings.cwd)
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

    const resizeObserver = new ResizeObserver(() => {
      // no-op, just to trigger the effect below
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
  }, [widgetApi, id, settings.shell, settings.cwd, settings.autoStartCommand]);

  // Update terminal settings when they change
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = settings.fontSize;
      xtermRef.current.options.fontFamily = settings.fontFamily;
      xtermRef.current.options.theme = settings.theme === 'dark' ? darkTheme : lightTheme;
    }
  }, [settings.fontSize, settings.fontFamily, settings.theme]);


  useEffect(() => {
    if (!terminalRef.current) return;
    const term = xtermRef.current;
    if (!term) return;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);
    return () => {
      resizeObserver.disconnect();
    };

  }, [terminalRef.current]);

  return (
    <div className={styles.terminal}>
      <div ref={terminalRef} className={styles.terminalContainer}></div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}