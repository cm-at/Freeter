/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AIProvider, ProviderConfig } from '../types';

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o'
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    apiEndpoint: 'https://api.anthropic.com/v1',
    models: ['claude-3.7-sonnet', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    defaultModel: 'claude-3.7-sonnet'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini (Google)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.5-flash'
  },
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    apiEndpoint: 'https://api.x.ai/v1',
    models: ['grok-3', 'grok-3-mini', 'grok-2-1212', 'grok-beta'],
    defaultModel: 'grok-3'
  }
};

export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
} 