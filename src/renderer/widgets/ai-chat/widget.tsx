/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import { ChatState, ChatSession, AIProvider } from './types';
import { Message } from '@ai-sdk/react';
import { 
  loadChatState, 
  saveChatState, 
  createNewSession, 
  findSessionById,
  updateSession,
  deleteSession,
  generateSessionTitle
} from './utils/storage';
import { PROVIDER_CONFIGS } from './utils/providers';
import { useEffect, useState, useCallback, useRef, KeyboardEvent } from 'react';
import { useAIChat } from './hooks/useAIChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MessageSquare, Plus, Paperclip, Send, X, Bot, User } from 'lucide-react';
import clsx from 'clsx';
import styles from './widget.module.scss';

function WidgetComp({ widgetApi, settings, env, sharedState }: WidgetReactComponentProps<Settings>) {
  const { dataStorage } = widgetApi;
  const [chatState, setChatState] = useState<ChatState>({ sessions: [], activeSessionId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get API keys from shared state
  const apiKeys = sharedState?.appConfig?.aiProviders || {};

  // Load chat state on mount
  useEffect(() => {
    const load = async () => {
      const state = await loadChatState(dataStorage);
      setChatState(state);
      setIsLoading(false);
    };
    load();
  }, [dataStorage]);

  // Save chat state on changes
  useEffect(() => {
    if (!isLoading) {
      saveChatState(dataStorage, chatState);
    }
  }, [chatState, dataStorage, isLoading]);

  // Get active session
  const activeSession = chatState.activeSessionId 
    ? findSessionById(chatState, chatState.activeSessionId)
    : null;

  // Get the appropriate API key for the provider
  const currentProvider = activeSession?.provider || settings.provider;
  const getApiKey = (provider: AIProvider): string | undefined => {
    switch (provider) {
      case 'openai': return apiKeys.openaiApiKey;
      case 'claude': return apiKeys.anthropicApiKey;
      case 'gemini': return apiKeys.googleApiKey;
      case 'grok': return apiKeys.xApiKey;
      default: return undefined;
    }
  };

  // Configure useAIChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading: isChatLoading,
    error,
    setMessages,
    append
  } = useAIChat({
    provider: currentProvider,
    model: activeSession?.model || settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    streamResponse: settings.streamResponse,
    apiKey: getApiKey(currentProvider),
    initialMessages: activeSession?.messages || [],
    onFinish: (message: Message) => {
      if (activeSession) {
        // Update session title if it's the first user message
        let updatedState = chatState;
        if (activeSession.messages.length === 0 && message.role === 'user') {
          updatedState = updateSession(chatState, activeSession.id, {
            title: generateSessionTitle(message.content)
          });
        }
        
        // Update messages
        updatedState = updateSession(updatedState, activeSession.id, {
          messages: [...messages, message]
        });
        
        setChatState(updatedState);
      }
    }
  });

  // Create new chat session
  const handleNewChat = useCallback(() => {
    const newSession = createNewSession(settings.provider, settings.model);
    setChatState({
      sessions: [newSession, ...chatState.sessions],
      activeSessionId: newSession.id
    });
    setMessages([]);
  }, [chatState.sessions, settings.provider, settings.model, setMessages]);

  // Select a chat session
  const handleSelectSession = useCallback((sessionId: string) => {
    const session = findSessionById(chatState, sessionId);
    if (session) {
      setChatState({ ...chatState, activeSessionId: sessionId });
      setMessages(session.messages);
    }
  }, [chatState, setMessages]);

  // Delete a chat session
  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = deleteSession(chatState, sessionId);
    setChatState(newState);
    
    if (newState.activeSessionId) {
      const newActiveSession = findSessionById(newState, newState.activeSessionId);
      setMessages(newActiveSession?.messages || []);
    } else {
      setMessages([]);
    }
  }, [chatState, setMessages]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new session if none exists
    if (!activeSession) {
      handleNewChat();
      // Wait for next tick to ensure session is created
      setTimeout(() => {
        originalHandleSubmit(e);
      }, 0);
    } else {
      originalHandleSubmit(e);
    }
  }, [activeSession, handleNewChat, originalHandleSubmit]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Toggle sidebar visibility based on settings and width
  useEffect(() => {
    if (!settings.showSidebar || env.isPreview) {
      setIsSidebarCollapsed(true);
    }
  }, [settings.showSidebar, env.isPreview]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading chat history...</div>
      </div>
    );
  }

  // Check if API key is configured
  const currentApiKey = getApiKey(currentProvider);
  if (!currentApiKey) {
    return (
      <div className={styles.container}>
        <div className={styles.noApiKey}>
          <MessageSquare size={48} />
          <h3>API Key Required</h3>
          <p>Please configure your {PROVIDER_CONFIGS[currentProvider].name} API key in Freeter Settings → AI Providers to use this widget.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, settings.compactMode && styles.compact)}>
      {/* Sidebar */}
      {!env.isPreview && (
        <aside className={clsx(styles.sidebar, isSidebarCollapsed && styles.hidden)}>
          <div className={styles.sidebarHeader}>
            <h3>Chats</h3>
            <button 
              className={styles.newChatButton}
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <Plus size={16} />
              New
            </button>
          </div>
          <div className={styles.chatList}>
            {chatState.sessions.map(session => (
              <div
                key={session.id}
                className={clsx(
                  styles.chatItem,
                  session.id === chatState.activeSessionId && styles.active
                )}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className={styles.chatTitle}>{session.title}</div>
                <div className={styles.chatDate}>
                  {new Date(session.updatedAt).toLocaleDateString()}
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  aria-label="Delete chat"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main chat area */}
      <main className={styles.main}>
        <div className={styles.chatArea}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <MessageSquare size={48} />
              <h3>Start a new conversation</h3>
              <p>Ask me anything! I'm here to help.</p>
            </div>
          ) : (
            messages.map((message: Message, index: number) => (
              <div 
                key={message.id || index} 
                className={clsx(styles.message, styles[message.role])}
              >
                <div className={styles.avatar}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={styles.messageContent}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const inline = node?.type === 'element' && node?.tagName !== 'pre';
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          
          {error && (
            <div className={clsx(styles.message, styles.error)}>
              <div className={styles.messageContent}>
                Error: {error.message}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <div className={styles.textareaWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                disabled={isChatLoading}
              />
            </div>
            <button
              type="button"
              className={styles.attachButton}
              aria-label="Attach file"
              disabled
              title="File attachments coming soon"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || isChatLoading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export const widgetComp: WidgetReactComponent<Settings> = {
  type: 'react',
  Comp: WidgetComp
}; 