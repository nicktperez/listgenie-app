// pages/chat.js
import { useState, useRef } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Append delta text to the last assistant message as it streams
  function appendToAssistant(delta) {
    setMessages((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") {
        return [...prev, { role: "assistant", content: delta }];
      }
      const clone = [...prev];
      clone[clone.length - 1] = {
        ...clone[clone.length - 1],
        content: (clone[clone.length - 1].content || "") + delta,
      };
      return clone;
    });
  }

  // inside pages/chat.js (or wherever your sendMessage lives)
async function sendMessage(e) {
  e.preventDefault();
  if (!input.trim()) return;

  const newMessages = [...messages, { role: 'user', content: input }];
  setMessages(newMessages);
  setInput('');
  setLoading(true);

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages /*, model: 'anthropic/claude-3.5-sonnet'*/ }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Chat API error:', data);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry — I had trouble talking to the model. Please try again.' },
      ]);
    } else {
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    }
  } catch (err) {
    console.error('Network error:', err);
    setMessages([
      ...newMessages,
      { role: 'assistant', content: 'Network error. Please try again.' },
    ]);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="container chat-page">
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <h1 className="headline">AI Chat Assistant</h1>
        <p className="subhead">Ask questions or generate listings instantly.</p>

        <div className="chat-box card">
          {messages.length === 0 && (
            <div className="empty-chat">
              <p className="text-dim">
                No messages yet. Ask me to draft a listing, an email, or a post!
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role === "user" ? "user" : "ai"}`}>
              <strong>{msg.role === "user" ? "You" : "Genie"}:</strong>{" "}
              {msg.content}
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type your message and press Enter…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button onClick={sendMessage} className="btn btn-primary" disabled={loading}>
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </SignedIn>
    </main>
  );
}