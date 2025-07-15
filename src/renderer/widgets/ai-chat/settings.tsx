/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';
import { AIProvider } from './types';
import { PROVIDER_CONFIGS } from './utils/providers';
import styles from './settings.module.scss';

export interface Settings {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
  showSidebar: boolean;
  compactMode: boolean;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  provider: settings.provider || 'openai',
  model: settings.model || PROVIDER_CONFIGS[settings.provider || 'openai'].defaultModel,
  temperature: typeof settings.temperature === 'number' ? settings.temperature : 0.7,
  maxTokens: typeof settings.maxTokens === 'number' ? settings.maxTokens : 2048,
  streamResponse: typeof settings.streamResponse === 'boolean' ? settings.streamResponse : true,
  showSidebar: typeof settings.showSidebar === 'boolean' ? settings.showSidebar : true,
  compactMode: typeof settings.compactMode === 'boolean' ? settings.compactMode : false,
});

function SettingsEditorComp({ settings, settingsApi }: SettingsEditorReactComponentProps<Settings>) {
  const { updateSettings } = settingsApi;
  const providerConfig = PROVIDER_CONFIGS[settings.provider];

  const handleProviderChange = (provider: AIProvider) => {
    const newProviderConfig = PROVIDER_CONFIGS[provider];
    updateSettings({
      ...settings,
      provider,
      model: newProviderConfig.defaultModel
    });
  };

  return (
    <div className={styles['settings-container']}>
      <SettingBlock
        titleForId='ai-provider'
        title='AI Provider'
        moreInfo='Select your preferred AI service provider'
      >
        <select
          id='ai-provider'
          value={settings.provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          className={styles['select-input']}
          aria-label='AI Provider selection'
        >
          {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='ai-model'
        title='Model'
        moreInfo='Choose the AI model to use for this provider'
      >
        <select
          id='ai-model'
          value={settings.model}
          onChange={(e) => updateSettings({ ...settings, model: e.target.value })}
          className={styles['select-input']}
          aria-label='AI Model selection'
        >
          {providerConfig.models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='temperature'
        title='Temperature'
        moreInfo='Controls randomness: 0 = focused, 1 = creative'
      >
        <div className={styles['range-container']}>
          <input
            type='range'
            id='temperature'
            min='0'
            max='1'
            step='0.1'
            value={settings.temperature}
            onChange={(e) => updateSettings({ ...settings, temperature: parseFloat(e.target.value) })}
            className={styles['range-input']}
            aria-label='Temperature slider'
          />
          <span className={styles['range-value']}>{settings.temperature.toFixed(1)}</span>
        </div>
      </SettingBlock>

      <SettingBlock
        titleForId='max-tokens'
        title='Max Response Length'
        moreInfo='Maximum number of tokens in the response'
      >
        <input
          type='number'
          id='max-tokens'
          min='256'
          max='8192'
          step='256'
          value={settings.maxTokens}
          onChange={(e) => updateSettings({ ...settings, maxTokens: parseInt(e.target.value) || 2048 })}
          className={styles['number-input']}
          aria-label='Max tokens input'
        />
      </SettingBlock>

      <SettingBlock
        titleForId='stream-response'
        title='Response Streaming'
        moreInfo='Show responses as they are generated'
      >
        <label className={styles['checkbox-container']}>
          <input
            type='checkbox'
            id='stream-response'
            checked={settings.streamResponse}
            onChange={() => updateSettings({ ...settings, streamResponse: !settings.streamResponse })}
            className={styles['checkbox-input']}
          />
          <span className={styles['checkbox-label']}>Stream responses in real-time</span>
        </label>
      </SettingBlock>

      <SettingBlock
        titleForId='show-sidebar'
        title='Chat Sidebar'
        moreInfo='Toggle the chat history sidebar'
      >
        <label className={styles['checkbox-container']}>
          <input
            type='checkbox'
            id='show-sidebar'
            checked={settings.showSidebar}
            onChange={() => updateSettings({ ...settings, showSidebar: !settings.showSidebar })}
            className={styles['checkbox-input']}
          />
          <span className={styles['checkbox-label']}>Show chat history sidebar</span>
        </label>
      </SettingBlock>

      <SettingBlock
        titleForId='compact-mode'
        title='Compact Mode'
        moreInfo='Reduce spacing for a more compact interface'
      >
        <label className={styles['checkbox-container']}>
          <input
            type='checkbox'
            id='compact-mode'
            checked={settings.compactMode}
            onChange={() => updateSettings({ ...settings, compactMode: !settings.compactMode })}
            className={styles['checkbox-input']}
          />
          <span className={styles['checkbox-label']}>Use compact UI layout</span>
        </label>
      </SettingBlock>

      <SettingBlock
        titleForId='api-keys-info'
        title='API Keys'
        moreInfo='API keys are managed in the main Freeter application settings'
      >
        <div className={styles['info-box']}>
          To add API keys for your chosen provider, go to <strong>Freeter Settings → AI Providers</strong>
        </div>
      </SettingBlock>
    </div>
  );
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}; 