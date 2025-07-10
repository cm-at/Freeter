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
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-3.5-turbo'
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    apiEndpoint: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-sonnet-20240229'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini (Google)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-pro'
  },
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    apiEndpoint: 'https://api.x.ai/v1',
    models: ['grok-1', 'grok-2'],
    defaultModel: 'grok-1'
  }
};

export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
} 