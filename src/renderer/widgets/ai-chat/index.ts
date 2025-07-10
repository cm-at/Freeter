/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'ai-chat',
  icon: widgetSvg,
  name: 'AI Chat',
  minSize: {
    w: 4,
    h: 4
  },
  description: 'Chat with AI assistants from OpenAI, Claude, Gemini, and more. Supports multiple conversations, markdown formatting, and code highlighting.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage'],
  requiresState: ['appConfig']
}

export default widgetType; 