/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AIProviderConfig } from '@/base/appConfig';
import { SettingBlock } from '@/widgets/appModules';
import { useState, useCallback, useEffect } from 'react';
import styles from './applicationSettings.module.scss';

interface AIProviderSettingsProps {
  aiProviders: AIProviderConfig;
  updateAIProviders: (providers: AIProviderConfig) => void;
}

interface ProviderInfo {
  key: keyof AIProviderConfig;
  name: string;
  description: string;
  placeholder: string;
  docsUrl: string;
}

const providers: ProviderInfo[] = [
  {
    key: 'openaiApiKey',
    name: 'OpenAI',
    description: 'API key for OpenAI GPT models (GPT-3.5, GPT-4, etc.)',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    key: 'anthropicApiKey',
    name: 'Claude (Anthropic)',
    description: 'API key for Claude models',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/account/keys'
  },
  {
    key: 'googleApiKey',
    name: 'Google Gemini',
    description: 'API key for Google Gemini models',
    placeholder: 'AIza...',
    docsUrl: 'https://makersuite.google.com/app/apikey'
  },
  {
    key: 'xApiKey',
    name: 'Grok (xAI)',
    description: 'API key for Grok models',
    placeholder: 'xai-...',
    docsUrl: 'https://x.ai/api'
  }
];

export function AIProviderSettings({ aiProviders, updateAIProviders }: AIProviderSettingsProps) {
  const [localValues, setLocalValues] = useState<AIProviderConfig>(aiProviders);
  const [showKeys, setShowKeys] = useState<Record<keyof AIProviderConfig, boolean>>({
    openaiApiKey: false,
    anthropicApiKey: false,
    googleApiKey: false,
    xApiKey: false
  });

  useEffect(() => {
    setLocalValues(aiProviders);
  }, [aiProviders]);

  const handleKeyChange = useCallback((key: keyof AIProviderConfig, value: string) => {
    const newValues = {
      ...localValues,
      [key]: value || undefined
    };
    setLocalValues(newValues);
    updateAIProviders(newValues);
  }, [localValues, updateAIProviders]);

  const toggleShowKey = useCallback((key: keyof AIProviderConfig) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const maskApiKey = (key?: string) => {
    if (!key) return '';
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  return (
    <>
      <div className={styles['ai-providers-intro']}>
        <p>Store your AI provider API keys securely. These keys are encrypted and stored locally on your device.</p>
        <p>To use AI features in widgets like AI Chat, you need to add at least one API key below.</p>
      </div>

      {providers.map(provider => (
        <SettingBlock
          key={provider.key}
          titleForId={`ai-key-${provider.key}`}
          title={provider.name}
          moreInfo={provider.description}
        >
          <div className={styles['api-key-input-group']}>
            <input
              id={`ai-key-${provider.key}`}
              type={showKeys[provider.key] ? 'text' : 'password'}
              value={localValues[provider.key] || ''}
              onChange={e => handleKeyChange(provider.key, e.target.value)}
              placeholder={provider.placeholder}
              className={styles['api-key-input']}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => toggleShowKey(provider.key)}
              className={styles['show-hide-button']}
              aria-label={showKeys[provider.key] ? 'Hide API key' : 'Show API key'}
            >
              {showKeys[provider.key] ? 'Hide' : 'Show'}
            </button>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles['docs-link']}
            >
              Get API Key
            </a>
          </div>
          {localValues[provider.key] && (
            <div className={styles['api-key-status']}>
              <span className={styles['status-icon']}>✓</span>
              <span>API key configured: {maskApiKey(localValues[provider.key])}</span>
            </div>
          )}
        </SettingBlock>
      ))}

      <SettingBlock
        titleForId="ai-security-note"
        title="Security Note"
      >
        <div className={styles['security-note']}>
          <p>🔒 Your API keys are stored securely on your local device and are never sent to any external servers.</p>
          <p>⚠️ Keep your API keys private and never share them with others.</p>
          <p>💡 If you suspect a key has been compromised, regenerate it immediately from your provider's dashboard.</p>
        </div>
      </SettingBlock>
    </>
  );
} 