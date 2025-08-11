// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";

/** ----------------------------- Config --------------------------------- */
const TONES = ["MLS-ready", "Social caption", "Luxury tone", "Concise"];

const EXAMPLES = [
  "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
  "Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
  "Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.",
];

/** Try to make model output readable even if it’s JSON-ish */
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

/** --------------------------- Component -------------------------------- */
export default function ChatPage() {
  const [tone, setTone] = useState(TONES[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content}
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showExamples, setShowExamples] = useState(true);

  const listRef = useRef(null);

  // Auto-scroll on new output
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, sending]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages]
  );

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setError("");

    const userMsg = { role: "user", content: input.trim(), tone };
    const messagesPlus = [...messages, userMsg]; // IMPORTANT: include the message we’re sending

    // Optimistic add
    setMessages(messagesPlus);
    setSending(true);
    setShowExamples(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.trim(),
          tone,
          messages: messagesPlus, // your API expects messages (non-empty)
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data?.ok === false) throw new Error(data?.error || "Server error");
        const assistantText = coerceToReadableText(data.message || data.content);
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      } else if (res.body && "getReader" in res.body) {
        // Streaming text
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            if (firstChunk) {
              next.push({ role: "assistant", content: chunk });
              firstChunk = false;
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
        const text = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: coerceToReadableText(text) }]);
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

  function extractTitle(s = "") {
    const line = s.split("\n").find((l) => l.trim()) || "";
    const upToDot = line.split(".")[0];
    return (upToDot || line).trim().slice(0, 120);
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

  // Hook to your modal/flyer flow. Right now it just dispatches an event you can listen for.
  function handleFlyer() {
    if (!lastAssistant?.content) return;
    window.dispatchEvent(
      new CustomEvent("open-flyer", {
        detail: { text: lastAssistant.content, tone },
      })
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 md:px-8 py-6 md:py-8 chat-shell">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold">ListGenie.ai Chat</h1>
            <span className="pro-pill">Pro</span>
          </div>
          <div className="subtle">Generate polished real estate listings plus social variants.</div>

          {/* Tone Pills */}
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
        </div>

        {/* Examples (white, small, disappear after first send) */}
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
        <div className="field-row">
          <textarea
            className="chat-field"
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
          <div className="mt-2">
            <button className="send-btn" disabled={sending || !input.trim()} onClick={sendMessage}>
              {sending ? "Generating…" : "Send"}
            </button>
          </div>
        </div>

        {/* Error surface */}
        {!!error && (
          <div className="msg-card error">
            <div>⚠️ {error}</div>
          </div>
        )}

        {/* Thread */}
        <div ref={listRef} className="thread">
          {messages.map((m, idx) => (
            <div key={idx} className="msg-card">
              <div className="bubble-header">{m.role === "user" ? "You" : "ListGenie"}</div>
              <div className="bubble-content">{m.content}</div>

              {m.role === "assistant" && (
                <div className="actions">
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

      {/* Scoped styling for the chat page only */}
      <style jsx global>{`
        .chat-shell {
          --chip-bg: rgba(255, 255, 255, 0.08);
          --chip-bg-hover: rgba(255, 255, 255, 0.14);
          --chip-border: rgba(255, 255, 255, 0.12);
          --field-bg: rgba(255, 255, 255, 0.05);
          --field-border: rgba(255, 255, 255, 0.12);
          color: #eaeaea;
        }

        .pro-pill {
          font-size: 12px;
          line-height: 1;
          padding: 6px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.35));
        }

        .subtle {
          opacity: 0.75;
          margin-bottom: 8px;
        }

        .tone-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .examples-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0 18px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 12px;
          border-radius: 9999px;
          background: var(--chip-bg);
          border: 1px solid var(--chip-border);
          color: #fff;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          transition: background 120ms ease, transform 80ms ease, opacity 120ms ease;
        }
        .chip:hover {
          background: var(--chip-bg-hover);
        }
        .chip.is-active {
          background: linear-gradient(
            90deg,
            rgba(139, 92, 246, 0.35),
            rgba(59, 130, 246, 0.35)
          );
          border-color: rgba(255, 255, 255, 0.18);
        }
        .example-chip {
          height: unset;
          padding: 8px 12px;
          font-size: 15px;
          white-space: nowrap;
          color: #fff; /* brighter for visibility per your request */
        }

        .field-row {
          margin: 10px 0 18px;
        }
        .chat-field {
          width: 100%;
          min-height: 130px;
          resize: vertical;
          background: var(--field-bg);
          border: 1px solid var(--field-border);
          border-radius: 12px;
          color: #fff;
          padding: 14px 16px;
          font-size: 16px;
          outline: none;
          box-shadow: 0 0 0 0 transparent;
        }
        .chat-field:focus {
          border-color: rgba(99, 102, 241, 0.45);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
        }

        .send-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          border-radius: 10px;
          border: 1px solid var(--chip-border);
          background: var(--chip-bg);
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          transition: background 120ms ease, transform 80ms ease, opacity 120ms ease;
        }
        .send-btn:hover {
          background: var(--chip-bg-hover);
        }
        .send-btn[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .thread {
          max-height: 58vh;
          overflow: auto;
          padding-right: 2px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-gutter: stable;
        }

        .msg-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--field-border);
          border-radius: 14px;
          padding: 14px;
          color: #fff;
        }
        .msg-card.error {
          border-color: rgba(244, 63, 94, 0.35);
          background: rgba(244, 63, 94, 0.08);
        }

        .bubble-header {
          font-size: 13px;
          text-transform: uppercase;
          opacity: 0.65;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .bubble-content {
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .thinking {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 9999px;
          padding: 6px 10px;
          width: fit-content;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.9);
          animation: dotPulse 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        .thinking-text {
          font-size: 13px;
          opacity: 0.9;
        }
        @keyframes dotPulse {
          0%,
          80%,
          100% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}