/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { createSettingsState, settingsEditorComp, Settings } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'browser',
  icon: widgetSvg,
  name: 'Browser',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'A full-featured browser widget with tabs, address bar, navigation controls, and browsing history.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['clipboard', 'shell', 'dataStorage']
}

export default widgetType; 