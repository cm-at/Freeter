/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { SettingBlock, SettingRow, SettingsEditorReactComponent, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  shell: string;
  shellType: 'default' | 'bash' | 'zsh' | 'fish' | 'custom';
  cwd: string;
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light' | 'monokai' | 'solarized-dark' | 'solarized-light' | 'dracula';
  autoStartCommand: string;
}

export function createSettingsState(): Settings {
  return {
    shell: '',
    shellType: 'default',
    cwd: '',
    fontSize: 14,
    fontFamily: 'monospace',
    theme: 'dark',
    autoStartCommand: ''
  }
}

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  const getShellPath = (shellType: string): string => {
    switch (shellType) {
      case 'bash': return '/bin/bash';
      case 'zsh': return '/bin/zsh';
      case 'fish': return '/usr/local/bin/fish';
      case 'custom': return settings.shell;
      default: return '';
    }
  };

  return (<>
    <SettingBlock title="Terminal Settings">
      <SettingRow>
        <label>Shell Type:</label>
        <select
          value={settings.shellType}
          onChange={e => {
            const newShellType = e.target.value as Settings['shellType'];
            updateSettings({ 
              ...settings, 
              shellType: newShellType,
              shell: newShellType === 'custom' ? settings.shell : getShellPath(newShellType)
            });
          }}
          aria-label="Shell Type"
        >
          <option value="default">System Default</option>
          <option value="bash">Bash (/bin/bash)</option>
          <option value="zsh">Zsh (/bin/zsh)</option>
          <option value="fish">Fish (/usr/local/bin/fish)</option>
          <option value="custom">Custom</option>
        </select>
      </SettingRow>
      {settings.shellType === 'custom' && (
        <SettingRow>
          <label>Custom Shell Path:</label>
          <input
            type="text"
            value={settings.shell}
            onChange={e => updateSettings({ ...settings, shell: e.target.value })}
            placeholder="e.g., /usr/local/bin/fish"
          />
        </SettingRow>
      )}
      <SettingRow>
        <label>Working Directory:</label>
        <input
          type="text"
          value={settings.cwd}
          onChange={e => updateSettings({ ...settings, cwd: e.target.value })}
          placeholder="Leave empty for default directory"
        />
      </SettingRow>
      <SettingRow>
        <label>Auto Start Command:</label>
        <input
          type="text"
          value={settings.autoStartCommand}
          onChange={e => updateSettings({ ...settings, autoStartCommand: e.target.value })}
          placeholder="Command to run on startup (optional)"
        />
      </SettingRow>
      <SettingRow>
        <label>Font Size:</label>
        <input
          type="number"
          value={settings.fontSize}
          onChange={e => updateSettings({ ...settings, fontSize: parseInt(e.target.value) || 14 })}
          min="8"
          max="32"
          aria-label="Font Size"
        />
      </SettingRow>
      <SettingRow>
        <label>Font Family:</label>
        <input
          type="text"
          value={settings.fontFamily}
          onChange={e => updateSettings({ ...settings, fontFamily: e.target.value })}
          placeholder="e.g., 'Monaco', 'Consolas', monospace"
        />
      </SettingRow>
      <SettingRow>
        <label>Theme:</label>
        <select
          value={settings.theme}
          onChange={e => updateSettings({ ...settings, theme: e.target.value as Settings['theme'] })}
          aria-label="Theme"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="monokai">Monokai</option>
          <option value="solarized-dark">Solarized Dark</option>
          <option value="solarized-light">Solarized Light</option>
          <option value="dracula">Dracula</option>
        </select>
      </SettingRow>
    </SettingBlock>
  </>)
}

export const settingsEditorComp: SettingsEditorReactComponent<Settings> = {
  type: 'react',
  Comp: SettingsEditorComp
}