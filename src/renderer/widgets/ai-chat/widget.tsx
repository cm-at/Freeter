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
import { MessageSquare, Plus, Paperclip, Send, X, Bot, User, AlertCircle, Check, Edit3, RefreshCw, Download, MoreVertical, Keyboard, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import styles from './widget.module.scss';
import { TypingIndicator } from './components/TypingIndicator';
import { MessageActions } from './components/MessageActions';
import { FileUploadPreview, UploadedFile } from './components/FileUploadPreview';
import { ChatExport } from './components/ChatExport';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ScrollToBottom } from './components/ScrollToBottom';
import { CodeBlock } from './components/CodeBlock';
import { ModelSelector } from './components/ModelSelector';

function WidgetComp({ widgetApi, settings, env, sharedState }: WidgetReactComponentProps<Settings>) {
  const { dataStorage } = widgetApi;
  const [chatState, setChatState] = useState<ChatState>({ sessions: [], activeSessionId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get API keys from shared state
  const apiKeys = sharedState?.appConfig?.aiProviders || {};

  // Debug logging
  console.log('[AI Chat Widget] API Keys from shared state:', apiKeys);
  console.log('[AI Chat Widget] Settings provider:', settings.provider);

  // Get the appropriate API key for the provider
  const getApiKey = useCallback((provider: AIProvider): string | undefined => {
    switch (provider) {
      case 'openai': return apiKeys.openaiApiKey;
      case 'claude': return apiKeys.anthropicApiKey;
      case 'gemini': return apiKeys.googleApiKey;
      case 'grok': return apiKeys.xApiKey;
      default: return undefined;
    }
  }, [apiKeys]);

  // Find first available provider with API key
  const getFirstAvailableProvider = useCallback((): AIProvider | null => {
    const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'grok'];
    for (const provider of providers) {
      const key = getApiKey(provider);
      console.log(`[AI Chat Widget] Checking ${provider}: ${key ? 'Has API key' : 'No API key'}`);
      if (key) {
        return provider;
      }
    }
    return null;
  }, [getApiKey]);

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

  // Get current session
  const activeSession = findSessionById(chatState, chatState.activeSessionId || '');
  const setMessages = (messages: Message[]) => {
    if (activeSession) {
      const updatedSession = { ...activeSession, messages, updatedAt: Date.now() };
      const newState = updateSession(chatState, activeSession.id, { messages, updatedAt: Date.now() });
      setChatState(newState);
    }
  };

  // Determine current provider - use session provider, settings provider, or first available
  const currentProvider = activeSession?.provider || settings.provider;
  const hasConfiguredApiKey = getApiKey(currentProvider);
  const effectiveProvider = hasConfiguredApiKey ? currentProvider : getFirstAvailableProvider();
  
  console.log('[AI Chat Widget] Current provider:', currentProvider);
  console.log('[AI Chat Widget] Has configured API key:', hasConfiguredApiKey);
  console.log('[AI Chat Widget] Effective provider:', effectiveProvider);
  console.log('[AI Chat Widget] API key for effective provider:', effectiveProvider ? getApiKey(effectiveProvider) : 'none');
  
  // Configure useAIChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading: isChatLoading,
    error,
    setInput,
    setMessages: setChatMessages,
    reload,
    stop
  } = useAIChat({
    provider: effectiveProvider || 'openai', // fallback to openai if no keys configured
    model: activeSession?.model || settings.model,
    apiKey: effectiveProvider ? getApiKey(effectiveProvider) : '',
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    streamResponse: settings.streamResponse,
    initialMessages: activeSession?.messages || [],
    onFinish: (message: Message) => {
      if (activeSession) {
        // Get all current messages from the hook including the new one
        const allMessages = [...messages, message];
        
        // Update session title if it's the first assistant response
        let updatedState = chatState;
        if (activeSession.messages.length === 1 && message.role === 'assistant') {
          const userMessage = activeSession.messages[0];
          updatedState = updateSession(chatState, activeSession.id, {
            title: generateSessionTitle(userMessage.content)
          });
        }
        
        // Update messages
        updatedState = updateSession(updatedState, activeSession.id, {
          messages: allMessages,
          updatedAt: Date.now()
        });
        
        setChatState(updatedState);
      }
    }
  });

  // Sync messages from activeSession to chat hook when session changes
  useEffect(() => {
    if (activeSession) {
      setChatMessages(activeSession.messages);
    }
  }, [activeSession?.id, setChatMessages]);

  // Create new chat session
  const handleNewChat = useCallback(async () => {
    const availableProvider = getFirstAvailableProvider();
    if (!availableProvider) return;
    
    const newSession = createNewSession(availableProvider, settings.model);
    const newState = { ...chatState, sessions: [...chatState.sessions, newSession], activeSessionId: newSession.id };
    setChatState(newState);
    await saveChatState(widgetApi, newState);
    setChatMessages([]);
    setInput('');
  }, [chatState, widgetApi, settings.model, getFirstAvailableProvider]);

  // Quick model change
  const handleQuickModelChange = useCallback((newModel: string) => {
    if (activeSession) {
      const updatedSession = { ...activeSession, model: newModel };
      const newState = updateSession(chatState, activeSession.id, { model: newModel });
      setChatState(newState);
      saveChatState(widgetApi, newState);
    }
  }, [activeSession, chatState, widgetApi]);

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

  // File handling
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Message actions
  const handleRegenerateMessage = useCallback((messageIndex: number) => {
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        // Remove AI response and regenerate
        const newMessages = messages.slice(0, messageIndex);
        setChatMessages(newMessages);
        // Trigger regeneration by resending the last user message
        setInput(userMessage.content);
        setTimeout(() => {
          handleSubmit({ preventDefault: () => {} } as any);
        }, 100);
      }
    }
  }, [messages, setChatMessages, handleSubmit, setInput]);

  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  // Scroll functionality
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    if (chatAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (e: globalThis.KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        switch (e.key) {
          case '/':
            e.preventDefault();
            setIsSidebarCollapsed(prev => !prev);
            break;
          case 'k':
            e.preventDefault();
            if (window.confirm('Clear all messages in this chat?')) {
              setChatMessages([]);
            }
            break;
          case 'e':
            e.preventDefault();
            if (activeSession && activeSession.messages.length > 0) {
              setShowExportMenu(prev => !prev);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [activeSession, setChatMessages]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.exportWrapper}`)) {
        setShowExportMenu(false);
      }
      if (!target.closest(`.${styles.shortcutsWrapper}`)) {
        setShowKeyboardShortcuts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const currentApiKey = effectiveProvider ? getApiKey(effectiveProvider) : null;
  if (!currentApiKey) {
    const availableProvider = getFirstAvailableProvider();
    return (
      <div className={styles.container}>
        <div className={styles.noApiKey}>
          <MessageSquare size={48} />
          <h3>API Key Required</h3>
          {availableProvider ? (
            <p>Please configure your {PROVIDER_CONFIGS[currentProvider].name} API key in Freeter Settings → AI Providers to use this widget.</p>
          ) : (
            <p>Please configure at least one AI provider API key in Freeter Settings → AI Providers to use this widget.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, settings.compactMode && styles.compact)}>
      {/* Sidebar */}
      {!isSidebarCollapsed && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Chats</h3>
            <button onClick={handleNewChat} disabled={!env.isPreview} aria-label="New chat">
              <Plus size={18} />
              New
            </button>
          </div>
          
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.chatList}>
            {chatState.sessions
              .filter(session => 
                session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(session => {
                const lastMessage = session.messages[session.messages.length - 1];
                const isActive = session.id === chatState.activeSessionId;
                
                return (
                  <div
                    key={session.id}
                    className={clsx(styles.chatItem, isActive && styles.active)}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className={styles.chatItemContent}>
                      <div className={styles.chatItemHeader}>
                        <span className={styles.chatItemTitle}>{session.title}</span>
                        <span className={styles.chatItemTime}>
                          {formatTimestamp(session.updatedAt)}
                        </span>
                      </div>
                      {lastMessage && (
                        <div className={styles.chatItemPreview}>
                          {lastMessage.content.substring(0, 50)}
                          {lastMessage.content.length > 50 && '...'}
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id, e);
                      }}
                      disabled={env.isPreview}
                      aria-label="Delete chat"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <button
            className={styles.toggleSidebar}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            <MessageSquare size={20} />
          </button>
          
          {activeSession && (
            <div className={styles.sessionInfo}>
              <h2>{activeSession.title}</h2>
              <span className={styles.messageCount}>
                {activeSession.messages.length} messages
              </span>
            </div>
          )}
          
          {activeSession && effectiveProvider && (
            <ModelSelector
              provider={effectiveProvider}
              model={activeSession.model}
              onModelChange={handleQuickModelChange}
              compact
            />
          )}
          
          <div className={styles.headerActions}>
            {activeSession && activeSession.messages.length > 0 && (
              <div className={styles.exportWrapper}>
                <button
                  className={styles.exportButton}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  aria-label="Export chat"
                >
                  <Download size={18} />
                </button>
                {showExportMenu && (
                  <div className={styles.exportDropdown}>
                    <ChatExport
                      messages={activeSession.messages}
                      sessionTitle={activeSession.title}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.shortcutsWrapper}>
              <button
                className={styles.shortcutsButton}
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                aria-label="Keyboard shortcuts"
              >
                <Keyboard size={18} />
              </button>
              {showKeyboardShortcuts && (
                <div className={styles.shortcutsDropdown}>
                  <KeyboardShortcuts />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.chatArea} ref={chatAreaRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <MessageSquare size={56} />
              <h3>Start a new conversation</h3>
              <p>Choose an AI assistant and ask anything - I'm here to help with coding, writing, analysis, and more.</p>
              {!env.isPreview && (
                <button onClick={handleNewChat}>
                  <Plus size={18} />
                  New Chat
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={styles.messagesContainer}>
                {messages.map((message: Message, index: number) => (
                  <div 
                    key={message.id || index} 
                    className={clsx(styles.message, styles[message.role])}
                    onMouseEnter={() => setHoveredMessageId(message.id || `${index}`)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className={styles.avatar}>
                      {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={styles.messageWrapper}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageRole}>
                          {message.role === 'user' ? 'You' : PROVIDER_CONFIGS[effectiveProvider || 'openai'].name}
                        </span>
                        {message.role === 'assistant' && effectiveProvider && (
                          <span className={styles.providerBadge}>
                            {effectiveProvider}
                          </span>
                        )}
                      </div>
                      <div className={styles.messageContent}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const inline = node?.type === 'element' && node?.tagName !== 'pre';
                              
                              if (!inline && match) {
                                return (
                                  <CodeBlock language={match[1]}>
                                    {String(children).replace(/\n$/, '')}
                                  </CodeBlock>
                                );
                              }
                              
                              return (
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
                      {hoveredMessageId === (message.id || `${index}`) && (
                        <MessageActions
                          content={message.content}
                          isUser={message.role === 'user'}
                          onRegenerate={message.role === 'assistant' ? () => handleRegenerateMessage(index) : undefined}
                          onEdit={message.role === 'user' ? () => setEditingMessageId(message.id || `${index}`) : undefined}
                        />
                      )}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className={clsx(styles.message, styles.assistant)}>
                    <div className={styles.avatar}>
                      <Bot size={16} />
                    </div>
                    <div className={styles.messageWrapper}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageRole}>
                          {PROVIDER_CONFIGS[effectiveProvider || 'openai'].name}
                        </span>
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorContent}>
                <AlertCircle size={16} />
                <span>{error.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <ScrollToBottom visible={showScrollButton} onClick={scrollToBottom} />
        )}

        {/* Input area */}
        <form onSubmit={handleSubmit} className={styles.inputArea}>
          <FileUploadPreview files={uploadedFiles} onRemove={handleRemoveFile} />
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.txt,.doc,.docx"
              aria-label="Upload files"
            />
            <button
              type="button"
              className={styles.attachButton}
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={env.isPreview}
            >
              <Paperclip size={18} />
            </button>
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || isChatLoading}
              aria-label="Send message"
            >
              {isChatLoading ? (
                <>
                  <div className={styles.spinner} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send</span>
                </>
              )}
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