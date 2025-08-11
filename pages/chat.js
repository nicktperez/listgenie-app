// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";

const TONES = ["MLS-ready", "Social caption", "Luxury tone", "Concise"];

const EXAMPLES = [
  "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
  "Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
  "Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.",
];

// best-effort: if model gave us JSON-ish content
function coerceToReadableText(raw) {
  if (!raw) return "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    // common shapes we produced earlier
    if (parsed && parsed.message && typeof parsed.message.content === "string") {
      return parsed.message.content;
    }
    if (parsed && typeof parsed.content === "string") return parsed.content;
    if (parsed && parsed.body && typeof parsed.body === "string") return parsed.body;
    // listing-ish
    if (parsed && parsed.mls && typeof parsed.mls.body === "string") return parsed.mls.body;
    return typeof raw === "string" ? raw : JSON.stringify(parsed, null, 2);
  } catch {
    return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
  }
}

export default function ChatPage() {
  const [tone, setTone] = useState(TONES[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:string}
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const firstSendRef = useRef(false);

  // scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages]
  );

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setError("");
    setSending(true);

    const userMsg = { role: "user", content: input.trim(), tone };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Prefer JSON API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), tone, messages }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      // handle either JSON or streamed text
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (!data || data.ok === false) {
          throw new Error(data?.error || "Server error");
        }
        const assistantText = coerceToReadableText(data.message || data.content);
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      } else if (res.body && "getReader" in res.body) {
        // streaming text
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const clone = [...prev];
            // if last is assistant in-progress append, else create new
            if (clone.length && clone[clone.length - 1].role === "assistant") {
              clone[clone.length - 1] = {
                ...clone[clone.length - 1],
                content: (clone[clone.length - 1].content || "") + decoder.decode(value),
              };
            } else {
              clone.push({ role: "assistant", content: decoder.decode(value) });
            }
            return clone;
          });
        }
      } else {
        const text = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: coerceToReadableText(text) }]);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Error");
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Server error" }]);
    } finally {
      setSending(false);
      setInput("");
      if (!firstSendRef.current) firstSendRef.current = true;
    }
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {}
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

  function extractTitle(s = "") {
    // take first sentence or first line as a title
    const line = s.split("\n").find((l) => l.trim().length > 0) || "";
    const upToDot = line.split(".")[0];
    return (upToDot || line).trim().slice(0, 120);
  }

  // Wire this to your modal or server flyer endpoint when ready.
  async function handleFlyer() {
    if (!lastAssistant?.content) return;
    // fire a custom event for your Flyer modal flow if you have one:
    // window.dispatchEvent(new CustomEvent("open-flyer", { detail: { text: lastAssistant.content, tone } }));
    // fallback: simple alert so users know button works
    alert("Flyer flow is ready to wire. Pass the latest listing text into your flyer modal/API.");
  }

  function quickToneClass(t) {
    return "chip" + (tone === t ? " is-active" : "");
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 md:px-8 py-6 md:py-8 chat-shell">
      <div className="max-w-5xl mx-auto">
        <header className="mb-4 md:mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">ListGenie.ai Chat</h1>
          <div className="text-white/70">Generate polished real estate listings plus social variants.</div>
          <div className="mt-3 tone-row">
            {TONES.map((t) => (
              <button
                key={t}
                className={quickToneClass(t)}
                onClick={() => setTone(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* Examples */}
        {!firstSendRef.current && (
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

        {/* Errors */}
        {!!error && (
          <div className="msg-card mb-4" style={{ borderColor: "rgba(244,63,94,0.35)" }}>
            <div>⚠️ {error}</div>
          </div>
        )}

        {/* Messages */}
        <div
          ref={listRef}
          className="space-y-3 max-h-[56vh] overflow-auto pr-1 pb-10"
          style={{ scrollbarGutter: "stable" }}
        >
          {messages.map((m, idx) => (
            <div key={idx} className="msg-card">
              <div
                className="text-[13px] uppercase tracking-wide mb-2"
                style={{ opacity: 0.65, letterSpacing: "0.08em" }}
              >
                {m.role === "user" ? "You" : "ListGenie"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

              {/* actions only on assistant messages */}
              {m.role === "assistant" && (
                <div className="flex gap-8 flex-wrap mt-3">
                  <button className="chip" onClick={() => handleCopy(m.content)}>Copy</button>
                  <button className="chip" onClick={handleSave}>Save</button>
                  <button className="chip" onClick={handleFlyer}>Flyer (PDF)</button>
                </div>
              )}
            </div>
          ))}

          {/* thinking indicator */}
          {sending && (
            <div className="msg-card">
              <div className="dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
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

        .chat-shell .tone-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .chat-shell .examples-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0 18px;
        }

        .chat-shell .chip {
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
        .chat-shell .chip:hover {
          background: var(--chip-bg-hover);
        }
        .chat-shell .chip:active {
          transform: translateY(1px);
        }
        .chat-shell .chip.is-active {
          background: linear-gradient(
            90deg,
            rgba(139, 92, 246, 0.35),
            rgba(59, 130, 246, 0.35)
          );
          border-color: rgba(255, 255, 255, 0.18);
        }

        .chat-shell .example-chip {
          height: unset;
          padding: 8px 12px;
          font-size: 15px;
          white-space: nowrap;
        }

        .chat-shell .field-row {
          margin: 10px 0 18px;
        }
        .chat-shell .chat-field {
          width: 100%;
          min-height: 120px;
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
        .chat-shell .chat-field:focus {
          border-color: rgba(99, 102, 241, 0.45);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
        }

        .chat-shell .send-btn {
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
        .chat-shell .send-btn:hover {
          background: var(--chip-bg-hover);
        }
        .chat-shell .send-btn:active {
          transform: translateY(1px);
        }
        .chat-shell .send-btn[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat-shell .msg-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--field-border);
          border-radius: 14px;
          padding: 14px;
          color: #fff;
        }

        /* thinking dots */
        .chat-shell .dots {
          display: inline-flex;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.06);
        }
        .chat-shell .dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.9);
          animation: dotPulse 1.2s infinite ease-in-out;
        }
        .chat-shell .dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .chat-shell .dot:nth-child(3) {
          animation-delay: 0.3s;
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

        /* contain width for readability */
        .chat-shell .msg-card,
        .chat-shell .examples-row,
        .chat-shell .tone-row,
        .chat-shell .field-row {
          max-width: 1100px;
        }
      `}</style>
    </main>
  );
}