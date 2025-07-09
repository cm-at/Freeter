/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, SettingsEditorReactComponentProps, ReactComponent, SettingBlock } from '@/widgets/appModules';
import { debounce } from '@common/helpers/debounce';
import { useCallback, useState } from 'react';

const settingsSessionScopes = ['app', 'prj', 'wfl', 'wgt'] as const;
export type SettingsSessionScope = typeof settingsSessionScopes[number];
function isSettingsSessionScope(val: unknown): val is SettingsSessionScope {
  if (typeof val !== 'string') {
    return false;
  }

  if (settingsSessionScopes.indexOf(val as SettingsSessionScope) > -1) {
    return true;
  }

  return false;
}

const settingsSessionPersist = ['persist', 'temp'] as const;
export type SettingsSessionPersist = typeof settingsSessionPersist[number];
function isSettingsSessionPersist(val: unknown): val is SettingsSessionPersist {
  if (typeof val !== 'string') {
    return false;
  }

  if (settingsSessionPersist.indexOf(val as SettingsSessionPersist) > -1) {
    return true;
  }

  return false;
}

export interface Settings {
  homeUrl: string;
  sessionPersist: SettingsSessionPersist;
  sessionScope: SettingsSessionScope;
  injectedCSS: string;
  injectedJS: string;
  userAgent: string;
  maxTabs: number;
  saveHistory: boolean;
  historyMaxItems: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  homeUrl: typeof settings.homeUrl === 'string' ? settings.homeUrl : '',
  sessionPersist: isSettingsSessionPersist(settings.sessionPersist) ? settings.sessionPersist : 'persist',
  sessionScope: isSettingsSessionScope(settings.sessionScope) ? settings.sessionScope : 'app',
  injectedCSS: typeof settings.injectedCSS === 'string' ? settings.injectedCSS : '',
  injectedJS: typeof settings.injectedJS === 'string' ? settings.injectedJS : '',
  userAgent: typeof settings.userAgent === 'string' ? settings.userAgent : '',
  maxTabs: typeof settings.maxTabs === 'number' && settings.maxTabs >= 1 ? settings.maxTabs : 10,
  saveHistory: typeof settings.saveHistory === 'boolean' ? settings.saveHistory : true,
  historyMaxItems: typeof settings.historyMaxItems === 'number' && settings.historyMaxItems >= 10 ? settings.historyMaxItems : 100,
})

const debounceUpdate3s = debounce((fn: () => void) => fn(), 3000);

export function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  const [homeUrl, setHomeUrl] = useState(settings.homeUrl);
  const [injectedJs, setInjectedJs] = useState(settings.injectedJS);
  const [userAgent, setUserAgent] = useState(settings.userAgent);
  
  const updateHomeUrl = useCallback((newVal: string, debounce: boolean) => {
    setHomeUrl(newVal);
    const updateValInSettings = () => updateSettings({
      ...settings,
      homeUrl: newVal
    })
    if (debounce) {
      debounceUpdate3s(updateValInSettings);
    } else {
      debounceUpdate3s.cancel();
      updateValInSettings();
    }
  }, [settings, updateSettings])
  
  const updateInjectedJs = useCallback((newVal: string, debounce: boolean) => {
    setInjectedJs(newVal);
    const updateValInSettings = () => updateSettings({
      ...settings,
      injectedJS: newVal
    })
    if (debounce) {
      debounceUpdate3s(updateValInSettings);
    } else {
      debounceUpdate3s.cancel();
      updateValInSettings();
    }
  }, [settings, updateSettings])
  
  const updateUserAgent = useCallback((newVal: string, debounce: boolean) => {
    setUserAgent(newVal);
    const updateValInSettings = () => updateSettings({
      ...settings,
      userAgent: newVal
    })
    if (debounce) {
      debounceUpdate3s(updateValInSettings);
    } else {
      debounceUpdate3s.cancel();
      updateValInSettings();
    }
  }, [settings, updateSettings])
  
  return (
    <>
      <SettingBlock
        titleForId='browser-home-url'
        title='Home URL'
        moreInfo='The default URL that opens when creating a new tab. Leave empty for blank page.'
      >
        <input id="browser-home-url" type="text" value={homeUrl} onChange={e => updateHomeUrl(e.target.value, true)} onBlur={e=>updateHomeUrl(e.target.value, false)} placeholder="Type a URL or leave empty" />
      </SettingBlock>

      <SettingBlock
        titleForId='browser-max-tabs'
        title='Maximum Tabs'
        moreInfo='Maximum number of tabs that can be opened at the same time.'
      >
        <select id="browser-max-tabs" aria-label="Maximum Tabs" value={settings.maxTabs} onChange={e => updateSettings({
          ...settings,
          maxTabs: Number.parseInt(e.target.value) || 10
        })}>
          <option value="3">3 Tabs</option>
          <option value="5">5 Tabs</option>
          <option value="10">10 Tabs</option>
          <option value="15">15 Tabs</option>
          <option value="20">20 Tabs</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='browser-history'
        title='Save History'
        moreInfo='Enable saving browsing history for quick access to previously visited sites.'
      >
        <select id="browser-history" aria-label="Save History" value={settings.saveHistory ? 'yes' : 'no'} onChange={e => updateSettings({
          ...settings,
          saveHistory: e.target.value === 'yes'
        })}>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </SettingBlock>

      {settings.saveHistory && (
        <SettingBlock
          titleForId='browser-history-max'
          title='History Size'
          moreInfo='Maximum number of history items to keep.'
        >
          <select id="browser-history-max" aria-label="History Size" value={settings.historyMaxItems} onChange={e => updateSettings({
            ...settings,
            historyMaxItems: Number.parseInt(e.target.value) || 100
          })}>
            <option value="50">50 Items</option>
            <option value="100">100 Items</option>
            <option value="200">200 Items</option>
            <option value="500">500 Items</option>
          </select>
        </SettingBlock>
      )}

      <SettingBlock
        titleForId='browser-session-scope'
        title='Session Scope'
        moreInfo='Session scope determines how login data is shared between browser widgets.'
      >
        <select id="browser-session-scope" aria-label="Session Scope" value={settings.sessionScope} onChange={e => updateSettings({
          ...settings,
          sessionScope: isSettingsSessionScope(e.target.value) ? e.target.value : 'prj'
        })}>
          <option value="app">Application</option>
          <option value="prj">Project</option>
          <option value="wfl">Workflow</option>
          <option value="wgt">Widget</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='browser-session-persistence'
        title='Session Persistence'
        moreInfo='Choose whether to persist session data after closing the application.'
      >
        <select id="browser-session-persistence" aria-label="Session Persistence" value={settings.sessionPersist} onChange={e => updateSettings({
          ...settings,
          sessionPersist: isSettingsSessionPersist(e.target.value) ? e.target.value : 'persist'
        })}>
          <option value="persist">Persistent</option>
          <option value="temp">Temporary</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='browser-inject-css'
        title='Inject CSS'
        moreInfo='CSS styles to inject into all pages.'
      >
        <textarea id="browser-inject-css" value={settings.injectedCSS} onChange={e => updateSettings({...settings, injectedCSS: e.target.value})} placeholder="Type CSS"></textarea>
      </SettingBlock>

      <SettingBlock
        titleForId='browser-inject-js'
        title='Inject JS'
        moreInfo='JavaScript code to inject into all pages.'
      >
        <textarea id="browser-inject-js" value={injectedJs} onChange={e => updateInjectedJs(e.target.value, true)} onBlur={e=>updateInjectedJs(e.target.value, false)} placeholder="Type JS"></textarea>
      </SettingBlock>

      <SettingBlock
        titleForId='browser-user-agent'
        title='User Agent'
        moreInfo='Custom User Agent string for the browser.'
      >
        <input id="browser-user-agent" type="text" value={userAgent} onChange={e => updateUserAgent(e.target.value, true)} onBlur={e=>updateUserAgent(e.target.value, false)} placeholder="Type User Agent string" />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
} 