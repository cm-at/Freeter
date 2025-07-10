/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Message } from '@ai-sdk/react';

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  apiEndpoint: string;
  models: string[];
  defaultModel: string;
}

export interface ChatSession {
  id: string;
  title: string;
  provider: AIProvider;
  model: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded
} 