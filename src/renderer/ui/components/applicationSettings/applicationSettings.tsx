/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ApplicationSettingsViewModelHook } from '@/ui/components/applicationSettings/applicationSettingsViewModel';
import clsx from 'clsx';
import styles from './applicationSettings.module.scss';
import settingsScreenStyles from '@/ui/components/basic/settingsScreen/settingsScreen.module.scss'
import { SettingsScreen } from '@/ui/components/basic/settingsScreen/settingsScreen';
import { SettingBlock } from '@/widgets/appModules';
import { memo } from 'react';
import { convertBoolToStr, convertStrToBool } from '@/base/convTypes';
import { PopupDomainSettings } from './popupDomainSettings';

type Deps = {
  useApplicationSettingsViewModel: ApplicationSettingsViewModelHook;
}

export function createApplicationSettingsComponent({
  useApplicationSettingsViewModel,
}: Deps) {
  function ApplicationSettings() {

    const {
      appConfig,
      hotkeyOptions,
      updateSettings,
      onOkClickHandler,
      onCancelClickHandler,
      uiThemeOptions,
      inactiveAfterOptions,
      activateOnProjectSwitchOptions
    } = useApplicationSettingsViewModel();

    if (appConfig) {
      return (<SettingsScreen title='Application Settings' onOkClick={onOkClickHandler} onCancelClick={onCancelClickHandler}>
        <div className={clsx(settingsScreenStyles['settings-screen-panel'], styles['settings-editor'])}>
          <SettingBlock
            titleForId='main-hot-key'
            title='Hotkey Combination'
            moreInfo='Hotkey enables you to bring Freeter to the front of the screen by pressing the specified key
                      combination.'
          >
            <select id="main-hot-key" aria-label="Hotkey Combination" value={appConfig.mainHotkey} onChange={e => updateSettings({
              ...appConfig,
              mainHotkey: e.target.value
            })}>
              {hotkeyOptions.map(item=>(
                <option key={item.value} value={item.value}>{item.caption}</option>
              ))}
            </select>
          </SettingBlock>

          <SettingBlock
            titleForId='ui-theme'
            title='User Interface Theme'
            moreInfo='The interface theme defines the appearance of all visual elements of the user interface.'
          >
            <select id="ui-theme" aria-label="User Interface Theme" value={appConfig.uiTheme} onChange={e => updateSettings({
              ...appConfig,
              uiTheme: e.target.value
            })}>
              {uiThemeOptions.map(item=>(
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </SettingBlock>

          <SettingBlock
            titleForId='inactive-after'
            title='Workflow Becomes Inactive After'
            moreInfo='This setting aims to reduce the app memory usage. When you switch workflows or projects, Freeter will
                      unload the idle workflows and free the memory. You will see a progress indicator when opening an
                      inactive workflow.'
          >
            <select id="inactive-after" aria-label="Workflow Becomes Inactive After" value={appConfig.memSaver.workflowInactiveAfter} onChange={e => updateSettings({
              ...appConfig,
              memSaver: {
                ...appConfig.memSaver,
                workflowInactiveAfter: Number.parseInt(e.target.value) || -1
              }
            })}>
              {inactiveAfterOptions.map(item=>(
                <option key={item.val} value={item.val}>{item.name}</option>
              ))}
            </select>
          </SettingBlock>

          <SettingBlock
            titleForId='activate-workflows-on-project-switch'
            title='Activate Workflows on Project Switch'
            moreInfo='When this setting is enabled, workflows of the project you are switching to will be loaded immediately.
                      Otherwise, they will be loaded when you will actually switch to them.'
          >
            <select id="activate-workflows-on-project-switch" aria-label="Activate Workflows on Project Switch" value={convertBoolToStr(appConfig.memSaver.activateWorkflowsOnProjectSwitch)} onChange={e => updateSettings({
              ...appConfig,
              memSaver: {
                ...appConfig.memSaver,
                activateWorkflowsOnProjectSwitch: convertStrToBool(e.target.value)
              }
            })}>
              {activateOnProjectSwitchOptions.map(item=>(
                <option key={convertBoolToStr(item.val)} value={convertBoolToStr(item.val)}>{item.name}</option>
              ))}
            </select>
          </SettingBlock>

          <PopupDomainSettings 
            popupDomains={appConfig.popupDomains}
            updatePopupDomains={(domains) => updateSettings({
              ...appConfig,
              popupDomains: domains
            })}
          />
        </div>
      </SettingsScreen>)
    } else {
      return null;
    }
  }

  return memo(ApplicationSettings);
}

export type ApplicationSettingsComponent = ReturnType<typeof createApplicationSettingsComponent>;
