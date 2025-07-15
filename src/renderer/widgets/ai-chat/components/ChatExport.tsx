/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React from 'react';
import { Download, FileText, FileJson, FileCode } from 'lucide-react';
import { Message } from '@ai-sdk/react';
import styles from './ChatExport.module.scss';

interface ChatExportProps {
  messages: Message[];
  sessionTitle: string;
}

export const ChatExport: React.FC<ChatExportProps> = ({ messages, sessionTitle }) => {
  const exportAsText = () => {
    const content = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}\n`
    ).join('\n');
    
    downloadFile(content, `${sessionTitle}.txt`, 'text/plain');
  };

  const exportAsMarkdown = () => {
    const content = `# ${sessionTitle}\n\n` + 
      messages.map(msg => 
        `## ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}\n\n---\n\n`
      ).join('');
    
    downloadFile(content, `${sessionTitle}.md`, 'text/markdown');
  };

  const exportAsJSON = () => {
    const data = {
      title: sessionTitle,
      exportedAt: new Date().toISOString(),
      messages: messages
    };
    
    downloadFile(JSON.stringify(data, null, 2), `${sessionTitle}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.exportMenu}>
      <div className={styles.header}>
        <Download size={16} />
        <span>Export Chat</span>
      </div>
      <div className={styles.options}>
        <button onClick={exportAsText} className={styles.option}>
          <FileText size={16} />
          <span>Plain Text</span>
        </button>
        <button onClick={exportAsMarkdown} className={styles.option}>
          <FileCode size={16} />
          <span>Markdown</span>
        </button>
        <button onClick={exportAsJSON} className={styles.option}>
          <FileJson size={16} />
          <span>JSON</span>
        </button>
      </div>
    </div>
  );
}; 