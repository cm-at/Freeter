/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Message } from '@ai-sdk/react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { AIProvider } from '../types';
import { streamText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';

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
  const [status, setStatus] = useState<'ready' | 'loading'>('ready');

  // Generate a unique ID for messages
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get the appropriate model based on provider
  const getModel = useCallback(() => {
    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}`);
    }

    switch (provider) {
      case 'openai':
        const openai = createOpenAI({ apiKey });
        return openai(model);
      case 'claude':
        const anthropic = createAnthropic({ apiKey });
        return anthropic(model);
      case 'gemini':
        const google = createGoogleGenerativeAI({ apiKey });
        return google(model);
      case 'grok':
        const xai = createXai({ apiKey });
        return xai(model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }, [provider, model, apiKey]);

  // Convert Message[] to CoreMessage[]
  const convertToCoreMessages = (messages: Message[]): CoreMessage[] => {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setStatus('loading');

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
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: new Date()
      };

      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage]);

      // Get the model instance
      const modelInstance = getModel();

      // Convert messages to core messages format
      const coreMessages = convertToCoreMessages(updatedMessages);

      if (streamResponse) {
        // Stream the response
        const result = await streamText({
          model: modelInstance,
          messages: coreMessages,
          temperature,
          maxTokens,
          abortSignal: abortControllerRef.current.signal,
        });

        // Stream the text content
        let fullContent = '';
        for await (const delta of result.textStream) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          
          fullContent += delta;
          
          // Update message content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          ));
        }

        // Call onFinish callback
        if (onFinish && !abortControllerRef.current?.signal.aborted) {
          const finalMessage = { ...assistantMessage, content: fullContent };
          onFinish(finalMessage);
        }
      } else {
        // Generate non-streaming response
        const result = await streamText({
          model: modelInstance,
          messages: coreMessages,
          temperature,
          maxTokens,
          abortSignal: abortControllerRef.current.signal,
        });

        // Wait for the full response
        const fullText = await result.text;
        
        // Update message content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: fullText }
            : msg
        ));

        // Call onFinish callback
        if (onFinish) {
          const finalMessage = { ...assistantMessage, content: fullText };
          onFinish(finalMessage);
        }
      }
    } catch (err) {
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
      
      if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          console.error('[AI Chat] Error:', err);
          
          // Provide more helpful error messages
          let errorMessage = err.message;
          
          if (err.message.includes('API key')) {
            errorMessage = `API key error for ${provider}: ${err.message}`;
          } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            errorMessage = `Invalid API key for ${provider}. Please check your API key in settings.`;
          } else if (err.message.includes('429') || err.message.includes('rate limit')) {
            errorMessage = `Rate limit exceeded for ${provider}. Please try again later.`;
          } else if (err.message.includes('model')) {
            errorMessage = `Invalid model "${model}" for ${provider}. Please check the model name.`;
          } else if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = `Network error. Please check your internet connection.`;
          }
          
          setError(new Error(errorMessage));
        }
      } else {
        setError(new Error('An unknown error occurred'));
      }
    } finally {
      setIsLoading(false);
      setStatus('ready');
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, streamResponse, getModel, temperature, maxTokens, onFinish, provider, model]);

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
      // Temporarily set input to trigger submission
      const originalInput = input;
      setInput(newMessage.content);
      await handleSubmit();
      setInput(originalInput);
    }
  }, [input, handleSubmit]);

  // Stop the current generation
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStatus('ready');
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

    // Set the last user message as input and resubmit
    const lastUserMessage = messages[lastUserMessageIndex];
    setInput(lastUserMessage.content);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      handleSubmit();
    }, 0);
  }, [messages, handleSubmit]);

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
    stop,
    status
  };
} 