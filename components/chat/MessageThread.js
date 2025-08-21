import React from "react";

export default function MessageThread({ messages, loading, error, onCopyListing, onModifyListing, onOpenFlyer }) {
  return (
    <section className="chat-area thread">
      {messages.map((message, index) => (
        <div key={index} className={`msg-card ${message.role}`}>
          <div className="msg-header">{message.role === "user" ? "You" : "ListGenie"}</div>
          <div className="msg-body">
            {message.role === "user"
              ? message.content
              : message.pretty || message.content || "Generating..."}
          </div>

          {message.role === "assistant" && message.pretty && message.pretty.includes('**') && (
            <div className="listing-actions">
              <div className="primary-actions">
                <button
                  className="copy-btn"
                  onClick={() => onCopyListing(message.pretty)}
                  title="Copy listing to clipboard"
                >
                  📋 Copy Listing
                </button>
                <button
                  className="flyer-btn-small"
                  onClick={onOpenFlyer}
                  title="Generate flyers from this listing"
                >
                  🎨 Create Flyers
                </button>
              </div>

              <div className="modification-options">
                <h4 className="modify-title">Modify Listing:</h4>
                <div className="modify-buttons">
                  <button
                    className="modify-btn"
                    onClick={() => onModifyListing(message.pretty, 'longer')}
                    title="Make the listing longer and more detailed"
                  >
                    📝 Make Longer
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => onModifyListing(message.pretty, 'modern')}
                    title="Make the listing more modern and contemporary"
                  >
                    🏢 More Modern
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => onModifyListing(message.pretty, 'country')}
                    title="Make the listing more country/rural focused"
                  >
                    🌾 More Country
                  </button>
                  <button
                    className="modify-btn"
                    onClick={() => onModifyListing(message.pretty, 'luxurious')}
                    title="Make the listing more luxurious and upscale"
                  >
                    ✨ More Luxurious
                  </button>
                </div>
              </div>
            </div>
          )}
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
