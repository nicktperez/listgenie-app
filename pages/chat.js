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

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const history = [...messages, { role: "user", content: input.trim() }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Server sends SSE "data: ..." lines, separated by \n\n
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);

          // Grab each line starting with "data:"
          const dataLines = chunk
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.replace(/^data:\s?/, ""));

          for (const line of dataLines) {
            if (line === "[DONE]") {
              inputRef.current?.focus();
              setLoading(false);
              return;
            }

            // Some events might be keepalives
            if (!line || line === "{}") continue;

            try {
              const json = JSON.parse(line);

              // OpenAI-style delta
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string") {
                appendToAssistant(delta);
              }

              // Some providers send full message segments
              const full = json?.choices?.[0]?.message?.content;
              if (typeof full === "string") {
                appendToAssistant(full);
              }

              // In case the server forwarded an error as JSON
              if (json?.error && typeof json.error === "string") {
                appendToAssistant(`\n[Error] ${json.error}`);
              }
            } catch {
              // Non-JSON payloads (ignore)
            }
          }
        }
      }

      // If we exit without [DONE], settle the UI
      setLoading(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Streaming chat error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I hit an error talking to the model. Please try again.",
        },
      ]);
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