import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:string}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");

    setLoading(true);
    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,             // minimal schema for our API
          model: "anthropic/claude-3.5-sonnet",
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistant = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: assistant }]);
      }
    } catch (err) {
      console.error("Stream error:", err);
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry — I hit an error talking to the model. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container chat-page">
      <h1 className="headline">AI Chat Assistant</h1>
      <p className="subhead">Ask questions or generate listings instantly.</p>

      <section ref={scrollerRef} className="chat-box" aria-live="polite">
        {messages.length === 0 && (
          <div className="empty-chat">Start a conversation...</div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`chat-msg ${m.role === "user" ? "user" : "ai"}`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="chat-msg ai">Genie is thinking…</div>
        )}
      </section>

      <form onSubmit={sendMessage} className="chat-input-row" aria-label="Send a message">
        <input
          className="chat-input"
          type="text"
          value={input}
          placeholder="Type your message and press Enter…"
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </main>
  );
}