/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AIProvider } from '../types';
import { PROVIDER_CONFIGS } from '../utils/providers';
import styles from './ModelSelector.module.scss';
import clsx from 'clsx';

interface ModelSelectorProps {
  provider: AIProvider;
  model: string;
  onModelChange: (model: string) => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  model,
  onModelChange,
  compact = false
}) => {
  const config = PROVIDER_CONFIGS[provider];

  return (
    <div className={clsx(styles.selector, compact && styles.compact)}>
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className={styles.select}
        aria-label="Select AI model"
      >
        {config.models.map(modelId => (
          <option key={modelId} value={modelId}>
            {modelId}
          </option>
        ))}
      </select>
      <ChevronDown className={styles.icon} size={16} />
    </div>
  );
}; 