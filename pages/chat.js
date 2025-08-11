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

  // Normalize to clean text first (strip ``` fences, trim)
  const stripCodeFences = (s) =>
    s
      .replace(/```json\s*([\s\S]*?)\s*```/gi, "$1")
      .replace(/```\s*([\s\S]*?)\s*```/gi, "$1")
      .trim();

  // If it's a string, try to parse (after removing fences)
  const tryParse = (s) => {
    try {
      const cleaned = stripCodeFences(s);
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  // Prefer object; parse string if needed
  let obj = typeof raw === "string" ? tryParse(raw) : raw;

  // If we parsed an object, try common shapes
  if (obj && typeof obj === "object") {
    // OpenAI-style
    if (obj?.message?.content) return String(obj.message.content).trim();
    if (typeof obj?.content === "string") return obj.content.trim();
    if (typeof obj?.body === "string") return obj.body.trim();
    // Our listing shape
    if (obj?.mls?.body) return String(obj.mls.body).trim();
    if (obj?.listing?.mls?.body) return String(obj.listing.mls.body).trim();
  }

  // If it wasn't/ isn’t parseable, but is a string, strip fences and return
  if (typeof raw === "string") {
    return stripCodeFences(raw);
  }

  // Last resort: readable JSON
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw ?? "");
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
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
      
        // start the assistant message immediately (for the thinking bubble to be replaced)
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
      
          // Live append raw text while streaming (so users see progress)
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: (next[next.length - 1].content || "") + chunk,
            };
            return next;
          });
        }
      
        // After stream completes, replace raw buffer with readable text
        const readable = coerceToReadableText(buffer);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: readable };
          return next;
        });
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