'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { messages, isLoading, sendMessage, stopStreaming, clearChat } = useChat();

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setUnread((count) => Math.min(99, count + 1));
    }
  }, [messages.length, isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const width = isExpanded ? 'min(700px, calc(100vw - 32px))' : 'min(380px, calc(100vw - 32px))';
  const height = isExpanded ? 'min(82vh, calc(100vh - 120px))' : 'min(520px, calc(100vh - 120px))';

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(124,58,237,0.35)',
          color: '#fff',
          cursor: 'pointer',
        }}
        aria-label="Toggle code coach chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && unread > 0 && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 0 0 3px rgba(15,23,42,0.75)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
              position: 'fixed',
              bottom: 92,
              right: 24,
              zIndex: 998,
              width,
              height,
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(124,58,237,0.18)',
              borderRadius: 24,
              boxShadow: '0 40px 100px rgba(15,23,42,0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,23,42,0.95)',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>CodePulse AI Coach</p>
                <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#94A3B8' }}>Context-aware LeetCode help, roadmaps, and code review.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                  aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <ChatInput onSend={sendMessage} onStop={stopStreaming} isLoading={isLoading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
