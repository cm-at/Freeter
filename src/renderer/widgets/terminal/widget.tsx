/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import * as styles from './widget.module.scss';
import { electronIpcRenderer as ipcRenderer } from '@/infra/mainApi/mainApi';
import { ipcTerminalCloseChannel, ipcTerminalCreateChannel, ipcTerminalOnDataChannel, ipcTerminalWriteChannel } from '@common/ipc/channels';

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
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const ptyIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: settings.theme === 'dark' ? darkTheme : lightTheme,
      cursorBlink: true
    });
    xtermRef.current = term;
    term.open(terminalRef.current);
    
    (ipcRenderer.invoke as any)(ipcTerminalCreateChannel, id, settings.shell, settings.cwd)
    .then(({ ptyId }: any) => {
      ptyIdRef.current = ptyId;
      term.onData(data => {
        ipcRenderer.send(ipcTerminalWriteChannel, ptyId, String(data));
      });

      ipcRenderer.on(ipcTerminalOnDataChannel, (event, incomingPtyId, data) => {
        if (incomingPtyId === ptyId) {
          term.write(String(data));
        }
      });
    })
    .catch(() => {
      term.writeln('\r\n[Terminal backend unavailable]\r\n');
      term.write('$ ');
    });

    const resizeObserver = new ResizeObserver(() => {
      // no-op, just to trigger the effect below
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      if (ptyIdRef.current !== null) {
        ipcRenderer.send(ipcTerminalCloseChannel, ptyIdRef.current);
      }
      term.dispose();
    };
  }, []);

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