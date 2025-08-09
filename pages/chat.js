// pages/chat.js
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

export default function Chat() {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    // Seed with a friendly system message if you like:
    // { role: "assistant", content: "Hi! I’m Genie. Ask me anything about your listing." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("anthropic/claude-3.5-sonnet"); // backend can override
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    } catch {}
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with ${res.status}`);
      }

      // Prepare a placeholder assistant message to stream into
      let assistant = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistant]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistant = { ...assistant, content: assistant.content + chunk };

        // Replace the last message (assistant) with the growing content
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = assistant;
          return copy;
        });
      }
    } catch (err) {
      console.error("Streaming chat error:", err);
      setMessages(prev => [
        ...prev,
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
    <div className="chat-container">
      <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.25rem" }}>
        AI Chat Assistant
      </h1>
      <p style={{ opacity: 0.85, marginBottom: "1rem" }}>
        Ask questions or generate listings instantly.
      </p>

      <SignedOut>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "1.25rem",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: "0.75rem" }}>
            Please sign in to start chatting.
          </p>
          <SignInButton mode="modal">
            <button
              className="btn"
              style={{
                background:
                  "linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)",
                color: "#000",
                fontWeight: 700,
                padding: "0.6rem 1rem",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div
          className="messages"
          ref={listRef}
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            maxHeight: "58vh",
            overflowY: "auto",
          }}
        >
          {messages.length === 0 && (
            <div
              className="message bot"
              style={{
                background: "transparent",
                opacity: 0.85,
                fontStyle: "italic",
              }}
            >
              Start a conversation…
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`message ${m.role === "user" ? "user" : "bot"}`}
            >
              {m.role === "user" ? (
                <strong style={{ marginRight: 6 }}>You:</strong>
              ) : (
                <strong style={{ marginRight: 6 }}>Genie:</strong>
              )}
              <span>{m.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="input-row">
          <input
            type="text"
            value={input}
            placeholder="Type your message and press Enter…"
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send"}
          </button>
        </form>
      </SignedIn>
    </div>
  );
}