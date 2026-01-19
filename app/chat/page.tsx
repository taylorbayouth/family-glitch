'use client';

import { useChat } from '@/lib/ai/client';
import { useState } from 'react';

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat({
    temperature: 0.7,
    reasoningEffort: 'medium',
  });

  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>AI Chat Demo (GPT-5.2)</h1>
        <button
          onClick={clearMessages}
          style={{
            padding: '8px 16px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          marginBottom: '20px',
          background: '#f9f9f9',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>
            Start a conversation. Try asking about the time or to calculate something!
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '6px',
              background: msg.role === 'user' ? '#e3f2fd' : '#fff',
              border: `1px solid ${msg.role === 'user' ? '#90caf9' : '#e0e0e0'}`,
            }}
          >
            <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
              {msg.role}:
            </strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <em>Thinking...</em>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px',
              background: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '6px',
              color: '#c62828',
            }}
          >
            Error: {error}
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 24px',
            background: isLoading || !input.trim() ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Send
        </button>
      </form>

      {/* Tool info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Available tools:</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>get_current_time - Get server time</li>
          <li>calculate - Evaluate math expressions</li>
          <li>lookup_customer - Fetch customer data (demo)</li>
        </ul>
        <p style={{ marginTop: '12px', fontStyle: 'italic' }}>
          Try: "What time is it?", "Calculate 42 * 1337", "Look up customer@example.com"
        </p>
      </div>
    </div>
  );
}
