/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AIProviderConfig } from '@/base/appConfig';
import { SettingBlock } from '@/widgets/appModules';
import { useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, ExternalLink, Key } from 'lucide-react';
import providerStyles from './aiProviderSettings.module.scss';

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
      <div style={{ marginBottom: '24px' }}>
        <p style={{ marginBottom: '8px', color: 'var(--freeter-componentSecondaryColor)' }}>
          Store your AI provider API keys securely. These keys are encrypted and stored locally on your device.
        </p>
        <p style={{ color: 'var(--freeter-componentSecondaryColor)' }}>
          To use AI features in widgets like AI Chat, you need to add at least one API key below.
        </p>
      </div>

      {providers.map(provider => (
        <div key={provider.key} className={providerStyles['provider-card']}>
          <div className={providerStyles['provider-header']}>
            <div className={providerStyles['provider-info']}>
              <div className={providerStyles['provider-icon']}>
                {provider.name.charAt(0)}
              </div>
              <h3 className={providerStyles['provider-name']}>{provider.name}</h3>
            </div>
            {localValues[provider.key] && (
              <span style={{ fontSize: '12px', color: 'var(--freeter-success)' }}>✓ Configured</span>
            )}
          </div>
          
          <p className={providerStyles['provider-description']}>
            {provider.description}
          </p>
          
          <div className={providerStyles['api-key-container']}>
            <input
              id={`ai-key-${provider.key}`}
              type={showKeys[provider.key] ? 'text' : 'password'}
              value={localValues[provider.key] || ''}
              onChange={e => handleKeyChange(provider.key, e.target.value)}
              placeholder={provider.placeholder}
              className={providerStyles['api-key-input']}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => toggleShowKey(provider.key)}
              className={providerStyles['toggle-button']}
              aria-label={showKeys[provider.key] ? 'Hide API key' : 'Show API key'}
            >
              {showKeys[provider.key] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={providerStyles['docs-link']}
          >
            Get your API key <ExternalLink size={12} />
          </a>
        </div>
      ))}

      {Object.keys(localValues).every(key => !localValues[key as keyof AIProviderConfig]) && (
        <div className={providerStyles['empty-state']}>
          <Key size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h3>No API Keys Configured</h3>
          <p>Add at least one API key to start using the AI Chat widget</p>
        </div>
      )}

      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        background: 'var(--freeter-componentBackground)',
        borderRadius: '8px',
        border: '1px solid var(--freeter-border)',
        fontSize: '13px',
        color: 'var(--freeter-componentSecondaryColor)'
      }}>
        <div style={{ marginBottom: '8px' }}>🔒 Your API keys are stored securely on your local device and are never sent to any external servers.</div>
        <div style={{ marginBottom: '8px' }}>⚠️ Keep your API keys private and never share them with others.</div>
        <div>💡 If you suspect a key has been compromised, regenerate it immediately from your provider's dashboard.</div>
      </div>
    </>
  );
} 