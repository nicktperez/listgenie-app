// pages/chat.js
import { useEffect, useRef, useState } from "react";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Head from "next/head";

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>Chat • ListGenie.ai</title>
      </Head>

      <section className="container chat-shell">
        <SignedOut>
          <div className="card stack" style={{ alignItems: "center", textAlign: "center" }}>
            <h2>Sign in to start chatting</h2>
            <p className="muted">You’ll be back here in a second.</p>
            <SignInButton mode="redirect">
              <button className="btn primary">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <ChatInner />
        </SignedIn>
      </section>
    </>
  );
}

function ChatInner() {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I’m ListGenie. Paste a property link or tell me a few details (beds, baths, upgrades, neighborhood) and I’ll draft your listing + email + posts.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("openrouter/anthropic/claude-3.5");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const content = input.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, model }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} – ${txt}`);
      }
      const data = await res.json();
      const reply = data?.message ?? data?.choices?.[0]?.message?.content ?? "(No reply)";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("OpenRouter error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I couldn’t reach the AI service. Double‑check your API key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-layout">
      {/* Chat window */}
      <div className="card">
        <div className="stack" style={{ marginBottom: 10 }}>
          <h1>Chat with ListGenie</h1>
          <p className="muted" style={{ marginTop: -6 }}>
            Signed in as <strong>{user?.primaryEmailAddress?.emailAddress ?? user?.fullName}</strong>
          </p>
        </div>

        <div className="chat-log" style={{ minHeight: 300 }}>
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}
          {loading && <Message role="assistant" content="Thinking…" dim />}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <form onSubmit={sendMessage} className="input-row">
          <textarea
            className="textarea"
            placeholder="Paste a listing link or describe the property…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send"}
          </button>
        </form>

        {/* Tiny options row */}
        <div className="stack" style={{ marginTop: 10 }}>
          <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>Model:</span>
            <select
              className="select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ maxWidth: 360 }}
            >
              <option value="openrouter/anthropic/claude-3.5">Claude 3.5 (OpenRouter)</option>
              <option value="openrouter/google/gemini-1.5-pro">Gemini 1.5 Pro (OpenRouter)</option>
              <option value="openrouter/meta/llama-3.1-70b">Llama 3.1 70B (OpenRouter)</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content, dim = false }) {
  const isUser = role === "user";
  return (
    <div className={`msg ${isUser ? "user" : "assistant"}`} style={dim ? { opacity: 0.7 } : undefined}>
      <strong style={{ display: "block", marginBottom: 4 }}>
        {isUser ? "You" : "Genie"}
      </strong>
      <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
    </div>
  );
}