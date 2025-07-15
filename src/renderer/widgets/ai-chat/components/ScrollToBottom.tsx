/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './ScrollToBottom.module.scss';
import clsx from 'clsx';

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

export const ScrollToBottom: React.FC<ScrollToBottomProps> = ({ visible, onClick }) => {
  return (
    <button
      className={clsx(styles.scrollButton, visible && styles.visible)}
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <ChevronDown size={20} />
    </button>
  );
}; 