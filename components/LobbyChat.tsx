import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/stores/chat-store';
import { useLobby } from '@/lib/stores/lobby-store';
import { useSession } from '@/lib/stores/session-store';

export default function LobbyChat() {
  const { messages, loading } = useChat();
  const { currentLobby } = useLobby();
  const { sessionId, displayName } = useSession();
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentLobby || sending) return;

    setSending(true);
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('chat_messages').insert({
        lobby_id: currentLobby.id,
        user_id: sessionId,
        message: inputMessage.trim(),
        message_type: 'user',
        metadata: { display_name: displayName }
      });

      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!currentLobby) {
    return (
      <div style={{ padding: '1rem', color: '#9ca3af', textAlign: 'center' }}>
        Join a lobby to start chatting
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1f2937',
      borderRadius: '0.5rem'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #374151',
        fontWeight: 600,
        color: '#fff'
      }}>
        Lobby Chat
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === sessionId;
            const senderName = msg.metadata?.display_name || msg.user_id.slice(0, 8);
            const isAI = msg.message_type === 'ai';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender name */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '0.25rem',
                  paddingLeft: isOwnMessage ? 0 : '0.5rem',
                  paddingRight: isOwnMessage ? '0.5rem' : 0
                }}>
                  {isAI ? '🤖 AI Assistant' : (isOwnMessage ? 'You' : senderName)}
                </div>

                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    background: isAI ? '#3b82f6' : (isOwnMessage ? '#10b981' : '#374151'),
                    color: '#fff',
                    wordWrap: 'break-word'
                  }}
                >
                  {msg.message}
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: '0.625rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                  paddingLeft: isOwnMessage ? 0 : '0.5rem',
                  paddingRight: isOwnMessage ? '0.5rem' : 0
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '1rem',
          borderTop: '1px solid #374151',
          display: 'flex',
          gap: '0.5rem'
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #374151',
            background: '#111827',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            background: inputMessage.trim() && !sending ? '#10b981' : '#374151',
            color: '#fff',
            border: 'none',
            cursor: inputMessage.trim() && !sending ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
