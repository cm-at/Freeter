/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { SettingBlock, SettingRow, SettingsEditorReactComponent, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  shell: string;
  cwd: string;
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light';
  autoStartCommand: string;
}

export function createSettingsState(): Settings {
  return {
    shell: '',
    cwd: '',
    fontSize: 14,
    fontFamily: 'monospace',
    theme: 'dark',
    autoStartCommand: ''
  }
}

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (<>
    <SettingBlock title="Terminal Settings">
      <SettingRow>
        <label>Shell Path:</label>
        <input
          type="text"
          value={settings.shell}
          onChange={e => updateSettings({ ...settings, shell: e.target.value })}
          placeholder="Leave empty for default shell"
        />
      </SettingRow>
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
        />
      </SettingRow>
      <SettingRow>
        <label>Font Family:</label>
        <input
          type="text"
          value={settings.fontFamily}
          onChange={e => updateSettings({ ...settings, fontFamily: e.target.value })}
        />
      </SettingRow>
      <SettingRow>
        <label>Theme:</label>
        <select
          value={settings.theme}
          onChange={e => updateSettings({ ...settings, theme: e.target.value as 'dark' | 'light' })}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </SettingRow>
    </SettingBlock>
  </>)
}

export const settingsEditorComp: SettingsEditorReactComponent<Settings> = {
  type: 'react',
  Comp: SettingsEditorComp
}