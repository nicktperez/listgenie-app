// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";

const TONES = ["MLS-ready", "Social caption", "Luxury tone", "Concise"];

const EXAMPLES = [
  "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
  "Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
  "Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.",
];

function coerceToReadableText(raw) {
  if (!raw) return "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed?.message?.content) return parsed.message.content;
    if (typeof parsed?.content === "string") return parsed.content;
    if (typeof parsed?.body === "string") return parsed.body;
    if (parsed?.mls?.body) return parsed.mls.body;
    return typeof raw === "string" ? raw : JSON.stringify(parsed, null, 2);
  } catch {
    return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
  }
}

export default function ChatPage() {
  const [tone, setTone] = useState(TONES[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role, content}
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showExamples, setShowExamples] = useState(true);

  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, sending]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages]
  );

  function extractTitle(s = "") {
    const line = s.split("\n").find((l) => l.trim()) || "";
    const upToDot = line.split(".")[0];
    return (upToDot || line).trim().slice(0, 120);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setError("");

    const userMsg = { role: "user", content: input.trim(), tone };
    const pending = [...messages, userMsg]; // include current message

    // optimistic add
    setMessages(pending);
    setSending(true);
    setShowExamples(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.trim(),
          tone,
          messages: pending, // API expects messages array; not empty
        }),
      });

      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.ok === false) throw new Error(data?.error || "Server error");
        const out = coerceToReadableText(data.message || data.content);
        setMessages((prev) => [...prev, { role: "assistant", content: out }]);
      } else if (res.body && "getReader" in res.body) {
        // streaming
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let first = true;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            if (first) {
              next.push({ role: "assistant", content: chunk });
              first = false;
            } else {
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: (next[next.length - 1].content || "") + chunk,
              };
            }
            return next;
          });
        }
      } else {
        const txt = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: coerceToReadableText(txt) }]);
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Server error");
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Server error" }]);
    } finally {
      setSending(false);
      setInput("");
    }
  }

  async function handleSave() {
    if (!lastAssistant?.content) return;
    try {
      const title = extractTitle(lastAssistant.content) || "Generated listing";
      const payload = {
        tone,
        content: lastAssistant.content,
        createdAt: new Date().toISOString(),
      };
      const res = await fetch("/api/listings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, payload }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error(e);
      setError("Save failed");
    }
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {}
  }

  function handleFlyer() {
    if (!lastAssistant?.content) return;
    // your modal listens for this
    window.dispatchEvent(
      new CustomEvent("open-flyer", { detail: { text: lastAssistant.content, tone } })
    );
  }

  return (
    <main className="chat-page">
      <div className="chat-wrap">
        {/* Header */}
        <div className="chat-header">
          <h1 className="chat-title">ListGenie.ai Chat</h1>
          <span className="pro-pill">Pro</span>
        </div>
        <div className="header-sub">Generate polished real estate listings plus social variants.</div>

        {/* Tones */}
        <div className="tone-row">
          {TONES.map((t) => (
            <button
              key={t}
              className={`chip ${tone === t ? "is-active" : ""}`}
              onClick={() => setTone(t)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Examples */}
        {showExamples && (
          <div className="examples-row">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="chip example-chip"
                onClick={() => setInput(ex)}
                type="button"
                title="Click to use this example"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="field-card">
          <textarea
            className="chat-textarea"
            placeholder="Describe the property and any highlights..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="field-actions">
            <button className="send-btn" disabled={sending || !input.trim()} onClick={sendMessage}>
              {sending ? "Generating…" : "Send"}
            </button>
          </div>
        </div>

        {/* Error */}
        {!!error && <div className="error-card">⚠️ {error}</div>}

        {/* Thread */}
        <div ref={listRef} className="thread">
          {messages.map((m, i) => (
            <div key={i} className="msg-card">
              <div className="msg-header">{m.role === "user" ? "You" : "ListGenie"}</div>
              <div className="msg-body">{m.content}</div>
              {m.role === "assistant" && (
                <div className="msg-actions">
                  <button className="chip" onClick={() => handleCopy(m.content)}>
                    Copy
                  </button>
                  <button className="chip" onClick={handleSave}>
                    Save
                  </button>
                  <button className="chip" onClick={handleFlyer}>
                    Flyer (PDF)
                  </button>
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="msg-card">
              <div className="thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="thinking-text">Thinking</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}