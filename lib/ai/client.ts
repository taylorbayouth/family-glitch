'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatRequest, ChatResponse, AIRequestConfig } from './types';

/**
 * Send a chat request to the API
 */
export async function sendChatRequest(
  messages: ChatMessage[],
  config?: Partial<AIRequestConfig>
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        config,
      } as ChatRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `Server error: ${response.status} ${response.statusText}`
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err) {
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Check your internet connection.');
    }
    throw err;
  }
}

/**
 * Custom hook for chat functionality
 */
export function useChat(defaultConfig?: Partial<AIRequestConfig>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message and get a response
   */
  const sendMessage = useCallback(
    async (content: string, config?: Partial<AIRequestConfig>) => {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content,
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      try {
        // Send request
        const response = await sendChatRequest(
          newMessages,
          { ...defaultConfig, ...config }
        );

        // Add assistant response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.text,
        };

        setMessages([...newMessages, assistantMessage]);
        setIsLoading(false);

        return assistantMessage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [messages, defaultConfig]
  );

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Set messages manually
   */
  const setMessagesManually = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages: setMessagesManually,
  };
}

/**
 * Simple one-off chat request (no state management)
 */
export async function chat(
  userMessage: string,
  config?: Partial<AIRequestConfig>
): Promise<string> {
  const response = await sendChatRequest(
    [{ role: 'user', content: userMessage }],
    config
  );
  return response.text;
}
