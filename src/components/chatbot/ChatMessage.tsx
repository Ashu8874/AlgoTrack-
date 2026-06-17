'use client';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isUser ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'rgba(124,58,237,0.15)',
        border: isUser ? 'none' : '1px solid rgba(124,58,237,0.3)',
      }}>
        {isUser ? <User size={15} color="#fff" /> : <Bot size={15} color="#A78BFA" />}
      </div>

      <div style={{ maxWidth: '78%' }}>
        <div style={{
          padding: '12px 14px',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          background: isUser ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'rgba(255,255,255,0.05)',
          color: isUser ? '#fff' : '#E2E8F0',
          fontSize: 14,
          lineHeight: 1.7,
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          wordBreak: 'break-word',
        }}>
          {isUser ? (
            <p style={{ margin: 0 }}>{message.content}</p>
          ) : (
            <div style={{ color: '#E2E8F0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </div>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#94A3B8', textAlign: isUser ? 'right' : 'left' }}>
          {format(message.timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
}
