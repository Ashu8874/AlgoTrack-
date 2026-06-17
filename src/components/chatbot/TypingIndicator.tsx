'use client';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(124,58,237,0.15)',
        border: '1px solid rgba(124,58,237,0.3)',
      }}>
        <Bot size={15} color="#A78BFA" />
      </div>
      <div style={{
        padding: '12px 16px',
        borderRadius: '4px 16px 16px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}>
        {[0, 1, 2].map((index) => (
          <span key={index} style={{
            width: 8,
            height: 8,
            borderRadius: '999px',
            background: '#7C3AED',
            opacity: 0.9,
            animation: `typing-dot 1.2s ease-in-out ${index * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
