// pages/chat.js
import { useState, useRef } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next, // user + prior history
          // optional override: model: "anthropic/claude-3.5-sonnet"
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.message }]);

      // Focus input again for fast follow-ups
      inputRef.current?.focus();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I hit an error talking to the model. Please try again.",
        },
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