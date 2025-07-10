/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ChatSession, ChatState } from '../types';

const CHAT_STATE_KEY = 'ai-chat-state';
const MAX_SESSIONS = 50;

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionTitle(firstMessage: string): string {
  // Generate a title from the first message, truncating if needed
  const cleanMessage = firstMessage.trim().replace(/\n/g, ' ');
  return cleanMessage.length > 40 
    ? cleanMessage.substring(0, 40) + '...'
    : cleanMessage || 'New Chat';
}

export async function loadChatState(dataStorage: any): Promise<ChatState> {
  try {
    const savedState = await dataStorage.getJson(CHAT_STATE_KEY) as ChatState | undefined;
    if (savedState && Array.isArray(savedState.sessions)) {
      // Clean up old sessions if we have too many
      if (savedState.sessions.length > MAX_SESSIONS) {
        savedState.sessions = savedState.sessions
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, MAX_SESSIONS);
      }
      return savedState;
    }
  } catch (error) {
    console.error('Failed to load chat state:', error);
  }
  
  return {
    sessions: [],
    activeSessionId: null
  };
}

export async function saveChatState(dataStorage: any, state: ChatState): Promise<void> {
  try {
    await dataStorage.setJson(CHAT_STATE_KEY, state);
  } catch (error) {
    console.error('Failed to save chat state:', error);
  }
}

export function createNewSession(provider: string, model: string): ChatSession {
  const id = generateSessionId();
  const now = Date.now();
  
  return {
    id,
    title: 'New Chat',
    provider: provider as any,
    model,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

export function findSessionById(state: ChatState, sessionId: string): ChatSession | undefined {
  return state.sessions.find(s => s.id === sessionId);
}

export function updateSession(state: ChatState, sessionId: string, updates: Partial<ChatSession>): ChatState {
  const sessions = state.sessions.map(session => 
    session.id === sessionId 
      ? { ...session, ...updates, updatedAt: Date.now() }
      : session
  );
  
  return {
    ...state,
    sessions
  };
}

export function deleteSession(state: ChatState, sessionId: string): ChatState {
  const sessions = state.sessions.filter(s => s.id !== sessionId);
  const activeSessionId = state.activeSessionId === sessionId 
    ? (sessions.length > 0 ? sessions[0].id : null)
    : state.activeSessionId;
    
  return {
    sessions,
    activeSessionId
  };
} 