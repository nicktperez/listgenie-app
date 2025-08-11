// pages/chat.js
import { useEffect, useRef, useState } from "react";

/** --- Utilities --------------------------------------------------------- */

/**
 * Coerce any LLM output (raw string, fenced JSON, or object)
 * to a clean human-readable paragraph. Prefers mls.body when present.
 */
function coerceToReadableText(raw) {
  if (!raw) return "";

  const stripCodeFences = (s) =>
    s
      .replace(/```json\s*([\s\S]*?)\s*```/gi, "$1")
      .replace(/```\s*([\s\S]*?)\s*```/gi, "$1")
      .trim();

  const tryParse = (s) => {
    try {
      const cleaned = stripCodeFences(s);
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  let obj = typeof raw === "string" ? tryParse(raw) : raw;

  if (obj && typeof obj === "object") {
    if (obj?.message?.content) return String(obj.message.content).trim();
    if (typeof obj?.content === "string") return obj.content.trim();
    if (typeof obj?.body === "string") return obj.body.trim();
    if (obj?.mls?.body) return String(obj.mls.body).trim();
    if (obj?.listing?.mls?.body) return String(obj.listing.mls.body).trim();
  }

  if (typeof raw === "string") {
    return stripCodeFences(raw);
  }

  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw ?? "");
  }
}

/** --- Component --------------------------------------------------------- */

export default function ChatPage() {
  const [tone, setTone] = useState("mls");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    // { role: 'user'|'assistant', content: string|object, pretty?: string }
  ]);
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef(null);

  // autoscroll to bottom on new messages
  useEffect(() => {
    const el = listEndRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const examples = [
    "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
    "Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
    "Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, and fenced garden.",
  ];

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    // optimistic user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", pretty: "" }, // placeholder for stream
    ]);
    setInput("");
    setLoading(true);

    try {
      // POST to your chat route (adjust if your API differs)
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
            })),
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Server error (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // paint partial
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.length - 1; // last is assistant placeholder
          next[idx] = { ...next[idx], content: buffer }; // raw buffer
          return next;
        });
      }

      // finalize: store pretty text so renderer can use it cheaply
      const pretty = coerceToReadableText(buffer);
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.length - 1;
        next[idx] = { ...next[idx], content: buffer, pretty };
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.slice(0, -1), // drop assistant placeholder
        { role: "assistant", content: "Server error. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /** UI helpers */
  const TonePill = ({ value, label }) => (
    <button
      onClick={() => setTone(value)}
      className={`px-3 py-1 rounded-full text-sm transition ${
        tone === value ? "bg-white/15 text-white" : "bg-white/5 text-white/75 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div className="title-row">
          <h1>ListGenie.ai Chat</h1>
          <span className="badge">Pro</span>
        </div>
        <p className="tagline">
          Generate polished real estate listings plus social variants.
        </p>
        <div className="tones">
          <TonePill value="mls" label="MLS-ready" />
          <TonePill value="social" label="Social caption" />
          <TonePill value="luxury" label="Luxury tone" />
          <TonePill value="concise" label="Concise" />
        </div>

        <div className="examples">
          {examples.map((ex, i) => (
            <button
              key={i}
              className="example"
              onClick={() => setInput(ex)}
              title="Use example"
            >
              {ex}
            </button>
          ))}
        </div>
      </header>

      <main className="chat-body">
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the property and any highlights..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!loading) handleSend();
              }
            }}
          />
          <div className="composer-actions">
            <button onClick={handleSend} disabled={loading} className="send">
              {loading ? "Generating…" : "Send"}
            </button>
          </div>
        </div>

        <div className="thread">
          {messages.map((m, i) => {
            const isAssistant = m.role === "assistant";
            // Always coerce at render-time; prefer the finalized "pretty" if present
            const readable = coerceToReadableText(m.pretty ?? m.content);

            return (
              <div key={i} className={`row ${isAssistant ? "ai" : "you"}`}>
                <div className="author">{isAssistant ? "ListGenie" : "You"}</div>

                <div className="bubble">
                  {isAssistant ? (
                    <div className="prose prose-invert whitespace-pre-wrap leading-relaxed">
                      {readable}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="row ai">
              <div className="author">ListGenie</div>
              <div className="bubble thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="thinking-label">Thinking</span>
              </div>
            </div>
          )}

          <div ref={listEndRef} />
        </div>
      </main>

      {/* --- Minimal styles (scoped) to restore your clean layout --- */}
      <style jsx global>{`
        :root {
          --bg: #0b0f18;
          --card: rgba(255, 255, 255, 0.04);
          --card2: rgba(255, 255, 255, 0.06);
          --stroke: rgba(255, 255, 255, 0.08);
          --text: rgba(255, 255, 255, 0.92);
          --text-dim: rgba(255, 255, 255, 0.7);
          --pill: rgba(255, 255, 255, 0.06);
          --pill-hover: rgba(255, 255, 255, 0.12);
          --primary: #8e8eff;
        }

        html, body, #__next {
          height: 100%;
          background: radial-gradient(1000px 700px at 20% -10%, #172133 25%, transparent), 
                      radial-gradient(1000px 700px at 120% -10%, #1a1730 15%, transparent),
                      var(--bg);
          color: var(--text);
        }

        .chat-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 20px 80px;
        }

        .chat-header .title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        .badge {
          background: var(--pill);
          border: 1px solid var(--stroke);
          color: var(--text-dim);
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
        }
        .tagline {
          margin: 6px 0 14px;
          color: var(--text-dim);
        }
        .tones {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .examples {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        @media (min-width: 800px) {
          .examples { grid-template-columns: 1fr 1fr 1fr; }
        }
        .example {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border-radius: 14px;
          color: var(--text);
          background: var(--pill);
          border: 1px solid var(--stroke);
          transition: background 0.2s ease;
        }
        .example:hover {
          background: var(--pill-hover);
        }

        .composer {
          background: var(--card);
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 18px;
        }
        .composer textarea {
          width: 100%;
          min-height: 130px;
          background: var(--card2);
          border: 1px solid var(--stroke);
          color: var(--text);
          border-radius: 12px;
          padding: 14px;
          outline: none;
          resize: vertical;
        }
        .composer-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .send {
          background: linear-gradient(135deg, var(--primary), #6ea8ff);
          color: #0b0f18;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          padding: 10px 16px;
          cursor: pointer;
        }
        .send:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .thread {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 10px;
          align-items: start;
        }
        .author {
          color: var(--text-dim);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding-top: 6px;
        }
        .bubble {
          background: var(--card);
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 14px;
          white-space: pre-wrap;
        }
        .row.you .bubble { background: rgba(255,255,255,0.03); }
        .row.ai .bubble { background: rgba(255,255,255,0.045); }

        .thinking {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-dim);
          animation: bounce 1.2s infinite;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.12s; }
        .dot:nth-child(3) { animation-delay: 0.24s; }
        .thinking-label {
          font-size: 12px;
          color: var(--text-dim);
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}