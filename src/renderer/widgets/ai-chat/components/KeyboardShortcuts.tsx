/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React from 'react';
import { Keyboard } from 'lucide-react';
import styles from './KeyboardShortcuts.module.scss';

export const KeyboardShortcuts: React.FC = () => {
  const shortcuts = [
    { keys: ['Enter'], description: 'Send message' },
    { keys: ['Shift', 'Enter'], description: 'New line' },
    { keys: ['Cmd/Ctrl', 'K'], description: 'Clear chat' },
    { keys: ['Cmd/Ctrl', 'D'], description: 'Delete message' },
    { keys: ['Cmd/Ctrl', 'E'], description: 'Export chat' },
    { keys: ['Cmd/Ctrl', '/'], description: 'Toggle sidebar' },
  ];

  return (
    <div className={styles.shortcuts}>
      <div className={styles.header}>
        <Keyboard size={16} />
        <span>Keyboard Shortcuts</span>
      </div>
      <div className={styles.list}>
        {shortcuts.map((shortcut, index) => (
          <div key={index} className={styles.shortcut}>
            <div className={styles.keys}>
              {shortcut.keys.map((key, i) => (
                <React.Fragment key={i}>
                  <kbd className={styles.key}>{key}</kbd>
                  {i < shortcut.keys.length - 1 && <span className={styles.plus}>+</span>}
                </React.Fragment>
              ))}
            </div>
            <span className={styles.description}>{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 