/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { useChat as useVercelChat, Message } from '@ai-sdk/react';
import { useCallback } from 'react';
import { AIProvider, ProviderConfig } from '../types';
import { PROVIDER_CONFIGS } from '../utils/providers';

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
  // For now, we'll use a mock implementation
  // In a real implementation, this would make API calls to the AI providers
  const mockApi = useCallback(async ({ messages, body }: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    const lastUserMessage = messages[messages.length - 1];
    const mockResponse = `This is a mock response to: "${lastUserMessage?.content}". 

To use real AI providers:
1. Add your API key in Freeter Settings → AI Providers
2. The widget will automatically use the configured provider (${provider})
3. Selected model: ${model}

For now, this is just a demo showing the chat interface functionality.`;

    // Return a mock streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = mockResponse.split(' ');
          
          for (const word of words) {
            if (streamResponse) {
              // Simulate streaming by sending words one at a time
              controller.enqueue(encoder.encode(`data: {"type":"text","text":"${word} "}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          if (!streamResponse) {
            // Send all at once if not streaming
            controller.enqueue(encoder.encode(`data: {"type":"text","text":"${mockResponse}"}\n\n`));
          }
          
          controller.enqueue(encoder.encode('data: {"type":"finish"}\n\n'));
          controller.close();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  }, [provider, model, streamResponse]);

  return useVercelChat({
    api: mockApi as any,
    streamProtocol: 'data',
    initialMessages,
    onFinish,
    body: {
      provider,
      model,
      temperature,
      maxTokens,
      stream: streamResponse
    }
  });
}

// Future implementation would include:
// - Real API integration with OpenAI, Claude, Gemini, and Grok
// - API key management from app settings
// - Error handling and retries
// - Token counting and usage tracking
// - Web search integration 