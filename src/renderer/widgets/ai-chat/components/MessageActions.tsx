/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React, { useState } from 'react';
import { Copy, RefreshCw, Edit3, Check } from 'lucide-react';
import styles from './MessageActions.module.scss';
import clsx from 'clsx';

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isUser: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRegenerate,
  onEdit,
  isUser
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.actions}>
      <button
        className={clsx(styles.actionButton, copied && styles.copied)}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy message'}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      
      {!isUser && onRegenerate && (
        <button
          className={styles.actionButton}
          onClick={onRegenerate}
          title="Regenerate response"
        >
          <RefreshCw size={14} />
        </button>
      )}
      
      {isUser && onEdit && (
        <button
          className={styles.actionButton}
          onClick={onEdit}
          title="Edit message"
        >
          <Edit3 size={14} />
        </button>
      )}
    </div>
  );
}; 