'use client';
import { useRef, useState, KeyboardEvent } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  "What are my weakest topics?",
  "Give me today's problem queue",
  "Prepare me for Google in 4 weeks",
  "Review my code",
  "Start a mock interview",
  "What's my contest rating trend?",
];

export default function ChatInput({ onSend, onStop, isLoading }: Props) {
  const [value, setValue] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextArea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = '44px';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      {showQuick && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                onSend(prompt);
                setShowQuick(false);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid rgba(124,58,237,0.2)',
                background: 'rgba(124,58,237,0.1)',
                color: '#C4B5FD',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10 }}>
        <button
          type="button"
          onClick={() => setShowQuick((prev) => !prev)}
          style={{ width: 34, height: 34, borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', cursor: 'pointer' }}
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            resizeTextArea();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask me anything about your LeetCode progress..."
          disabled={isLoading}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#E2E8F0',
            fontSize: 14,
            lineHeight: '20px',
            minHeight: 44,
            maxHeight: 140,
          }}
        />

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.35)', color: '#FCA5A5', cursor: 'pointer' }}
            title="Stop"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim()}
            style={{ width: 34, height: 34, borderRadius: 12, border: 'none', background: value.trim() ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: value.trim() ? 'pointer' : 'not-allowed' }}
            title="Send"
          >
            <Send size={16} />
          </button>
        )}
      </div>
      <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 11, textAlign: 'center' }}>Press Enter to send, Shift+Enter for newline.</p>
    </div>
  );
}
