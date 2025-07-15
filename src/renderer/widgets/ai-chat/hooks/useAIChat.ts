/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Message } from '@ai-sdk/react';
import { useCallback, useState, useRef } from 'react';
import { AIProvider } from '../types';

interface UseAIChatOptions {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  streamResponse: boolean;
  apiKey?: string;
  onFinish?: (message: Message) => void;
  initialMessages?: Message[];
}

export function useAIChat({
  provider,
  model,
  temperature,
  maxTokens,
  streamResponse,
  apiKey,
  onFinish,
  initialMessages = []
}: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate a unique ID for messages
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Mock streaming implementation
  const streamMockResponse = useCallback(async (userMessage: Message) => {
    const mockResponse = `This is a mock response to: "${userMessage.content}". 

**Note: This is a demo implementation**
- Your ${provider.toUpperCase()} API key is configured ✓
- Selected model: ${model}
- However, actual API integration is not yet implemented

The real implementation would:
- Make actual API calls to ${provider === 'claude' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : provider.charAt(0).toUpperCase() + provider.slice(1)}
- Stream real AI responses
- Support all configured features like temperature (${temperature}) and max tokens (${maxTokens})

For now, this demo shows the chat interface functionality with mock responses.`;

    // Create assistant message
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      createdAt: new Date()
    };

    // Add assistant message to state
    setMessages(prev => [...prev, assistantMessage]);

    if (streamResponse) {
      // Simulate streaming by adding words one at a time
      const words = mockResponse.split(' ');
      let currentContent = '';

      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        currentContent += (i > 0 ? ' ' : '') + words[i];
        
        // Update message content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: currentContent }
            : msg
        ));

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      // Add full response at once
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: mockResponse }
          : msg
      ));
    }

    // Call onFinish callback
    if (onFinish) {
      const finalMessage = { ...assistantMessage, content: streamResponse ? mockResponse : mockResponse };
      onFinish(finalMessage);
    }
  }, [provider, model, streamResponse, onFinish]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date()
    };

    // Add user message to state and clear input
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stream the mock response
      await streamMockResponse(userMessage);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred'));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, streamMockResponse]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Append a message programmatically
  const append = useCallback(async (message: Omit<Message, 'id' | 'createdAt'>) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    if (message.role === 'user') {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await streamMockResponse(newMessage);
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('An unknown error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [streamMockResponse]);

  // Stop the current generation
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Reload the last response
  const reload = useCallback(async () => {
    if (messages.length === 0) return;

    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(newMessages);

    // Regenerate response
    const lastUserMessage = messages[lastUserMessageIndex];
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await streamMockResponse(lastUserMessage);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unknown error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, streamMockResponse]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setInput,
    setMessages,
    append,
    reload,
    stop
  };
}

// Future implementation would include:
// - Real API integration with OpenAI, Claude, Gemini, and Grok
// - API key management from app settings
// - Error handling and retries
// - Token counting and usage tracking
// - Web search integration 