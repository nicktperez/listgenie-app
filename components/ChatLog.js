import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/hooks/useChatUtils';
import ListingRender from './ListingRender';

export default function ChatLog({ messages, loading, error, onFlyer, onModify }) {
  const listRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function handleCopy(text) {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <section className="chat-log" ref={listRef}>
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <div className="message-content">
            {message.role === 'user' ? (
              <span className="user-message">{message.content}</span>
            ) : (
              <div className="assistant-message">
                {message.pretty ? (
                  <div>
                    {message.pretty}
                    {message.pretty.includes('**') && (
                      <div className="listing-actions">
                        <div className="primary-actions">
                          <button className="copy-btn" onClick={() => handleCopy(message.pretty)}>
                            {copied ? '✅ Copied!' : '📋 Copy Listing'}
                          </button>
                          {onFlyer && (
                            <button className="flyer-btn-small" onClick={() => onFlyer(message.pretty)}>
                              🎨 Create Flyers
                            </button>
                          )}
                        </div>
                        {onModify && (
                          <div className="modification-options">
                            <h4 className="modify-title">Modify Listing:</h4>
                            <div className="modify-buttons">
                              <button className="modify-btn" onClick={() => onModify(message.pretty, 'longer')}>
                                📝 Make Longer
                              </button>
                              <button className="modify-btn" onClick={() => onModify(message.pretty, 'modern')}>
                                🏢 More Modern
                              </button>
                              <button className="modify-btn" onClick={() => onModify(message.pretty, 'country')}>
                                🌾 More Country
                              </button>
                              <button className="modify-btn" onClick={() => onModify(message.pretty, 'luxurious')}>
                                ✨ More Luxurious
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : message.content && message.content.includes('```') ? (
                  <ListingRender title="Generated Listing" content={message.content} />
                ) : (
                  message.content || 'Generating...'
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="loading">
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <div className="loading-text">Generating your listing...</div>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </section>
  );
}

