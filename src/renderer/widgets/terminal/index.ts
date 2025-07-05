/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'terminal',
  icon: widgetSvg,
  name: 'Terminal',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'An embedded terminal widget powered by xterm.js',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['terminal', 'dataStorage']
}

export default widgetType;