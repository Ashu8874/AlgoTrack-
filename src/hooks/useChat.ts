'use client';
import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your CodePulse AI coach. Ask me about your LeetCode stats, weak topics, interview roadmaps, code review, or mock interview practice.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const messageId = `${Date.now()}-user`;
    const assistantId = `${Date.now()}-assistant`;
    const userMessage = {
      id: messageId,
      role: 'user' as const,
      content: trimmed,
      timestamp: new Date(),
    };
    const assistantMessage = {
      id: assistantId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    const history: ConversationMessage[] = [...messages, userMessage]
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.content }));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversationHistory: history }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || 'Chat server error';
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('No response body from chat server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partial = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        partial += chunk;

        const lines = partial.split('\n');
        partial = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.replace(/^data:\s*/, '').trim();
          if (payload === '[DONE]') {
            setMessages((prev) => prev.map((message) =>
              message.id === assistantId ? { ...message, isStreaming: false } : message,
            ));
            break;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              setMessages((prev) => prev.map((message) =>
                message.id === assistantId ? { ...message, content: `${message.content}${parsed.text}` } : message,
              ));
            }
          } catch {
            // ignore malformed SSE payload
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message || 'Could not send your message. Please try again.');
        setMessages((prev) => prev.filter((message) => message.id !== assistantId));
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message?: string };
        setError(err.message || 'Could not send your message. Please try again.');
        setMessages((prev) => prev.filter((message) => message.id !== assistantId));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, messages]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => prev.map((message) =>
      message.isStreaming ? { ...message, isStreaming: false } : message,
    ));
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "The chat is cleared. Ask me anything about your LeetCode progress or goals.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
