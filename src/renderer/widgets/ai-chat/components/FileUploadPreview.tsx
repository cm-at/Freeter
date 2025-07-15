/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React from 'react';
import { File, Image, X } from 'lucide-react';
import styles from './FileUploadPreview.module.scss';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface FileUploadPreviewProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ files, onRemove }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    return <File size={16} />;
  };

  if (files.length === 0) return null;

  return (
    <div className={styles.preview}>
      {files.map(file => (
        <div key={file.id} className={styles.file}>
          {file.preview && file.type.startsWith('image/') ? (
            <img src={file.preview} alt={file.name} className={styles.thumbnail} />
          ) : (
            <div className={styles.icon}>{getFileIcon(file.type)}</div>
          )}
          <div className={styles.info}>
            <div className={styles.name}>{file.name}</div>
            <div className={styles.size}>{formatFileSize(file.size)}</div>
          </div>
          <button
            className={styles.remove}
            onClick={() => onRemove(file.id)}
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}; 