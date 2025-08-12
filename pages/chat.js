// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response
// - Pro-gated flyer modal (Standard + Open House)
// - Downloads PDF via /api/flyer

import { useEffect, useRef, use, useState } from "react";
import { useRouter } from "next/router";
import useUserPlan from "@/lib/useUserPlan";

/** ---------------- Utilities ---------------- */
function stripFences(s = "") {
  return s
    .replace(/```json\s*([\s\S]*?)\s*```/gi, "$1")
    .replace(/```\s*([\s\S]*?)\s*```/gi, "$1")
    .trim();
}

// Coerce any LLM output (raw string, fenced JSON, or object) to readable text
function coerceToReadableText(raw) {
  if (!raw) return "";

  // If object-like, try common shapes
  if (typeof raw === "object") {
    const candidate = raw?.mls?.body || raw?.mls || raw?.content || raw?.text || raw?.body;
    if (candidate) return stripFences(String(candidate));
    try { return stripFences(JSON.stringify(raw, null, 2)); } catch { /* noop */ }
  }

  const txt = String(raw);
  // Try to parse JSON
  try {
    const j = JSON.parse(stripFences(txt));
    const candidate = j?.mls?.body || j?.mls || j?.content || j?.text || j?.body;
    if (candidate) return stripFences(String(candidate));
    return stripFences(JSON.stringify(j, null, 2));
  } catch {
    return stripFences(txt);
  }
}

// Detect formatted sections
function splitVariants(text) {
  if (!text) return null;
  const patterns = [
    { key: "mls",    rx: /(^|\n)\s*#{0,3}\s*(MLS-?Ready|MLS Ready)\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "social", rx: /(^|\n)\s*#{0,3}\s*Social\s*Caption\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "luxury", rx: /(^|\n)\s*#{0,3}\s*Luxury\s*Tone\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
    { key: "concise", rx: /(^|\n)\s*#{0,3}\s*Concise(?:\s*Version)?\s*\n([\s\S]*?)(?=\n\s*#{0,3}\s*|$)/i },
  ];
  const out = {}; let found = false;
  for (const { key, rx } of patterns) {
    const m = text.match(rx);
    if (m) { out[key] = (m[3] || m[2] || "").trim(); found = true; }
  }
  return found ? out : null;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** ---------------- Page ---------------- */
export default function ChatPage() {
  const router = useRouter();
  const { isPro } = useUserPlan();

  // Input
  const [tone, setTone] = useState("mls");
  const [input, setInput] = useState("");

  // Chat state
  const [messages, setMessages] = useState([
    // { role: 'user'|'assistant', content: string, pretty?: string }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Flyers
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [flyerTypes, setFlyerTypes] = useState({ standard: true, openHouse: false });
  const [flyerBusy, setFlyerBusy] = useState(false);

  const listRef = useRef(null);
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const examples = [
    {
      label: "3BR Craftsman in Midtown",
      text:
        "3 bed, 2 bath Craftsman in Midtown. 1,650 sqft, updated kitchen, quartz counters, oak floors, detached garage, walkable to cafés and parks.",
    },
    {
      label: "Modern Condo DTLA",
      text:
        "1 bed, 1 bath modern condo, 780 sqft with skyline views, floor-to-ceiling windows, pool, gym, 24/7 security, near transit.",
    },
    {
      label: "Luxury Estate",
      text:
        "5 bed, 6 bath estate on 2 acres, 6,200 sqft, chef's kitchen, wine cellar, home theater, infinity pool, smart home, gated entry.",
    },
  ];

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    // optimistic add
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", pretty: "" }, // placeholder for stream
    ]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // Call your chat route. This assumes your existing /api/chat supports streaming.
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, tone }),
      });

      if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`);

      if (resp.body && resp.body.getReader) {
        // Stream reader
        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const pretty = coerceToReadableText(acc);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy.length - 1;
            copy[last] = { ...copy[last], content: acc, pretty };
            return copy;
          });
        }
      } else {
        // Non-streaming fallback
        const data = await resp.json();
        const text = coerceToReadableText(data);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text, pretty: text };
          return copy;
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  }

  function openFlyerModal() {
    if (!isPro) { router.push("/upgrade"); return; }
    setFlyerOpen(true);
  }

  async function generateFlyers() {
    if (!isPro) { router.push("/upgrade"); return; }
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const content = lastAssistant?.pretty || lastAssistant?.content || "";
    if (!content.trim()) return;

    const payload = {
      flyers: Object.entries(flyerTypes)
        .filter(([_, v]) => v)
        .map(([k]) => k),
      content: { single: content },
    };

    try {
      setFlyerBusy(true);
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Flyer API error");

      if (res.headers.get("content-type")?.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "flyer.pdf"; document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); a.remove();
      } else {
        // JSON with urls (alternate server behavior)
        const data = await res.json();
        const urls = data?.urls || (data?.url ? [data.url] : []);
        for (const u of urls) {
          const a = document.createElement("a");
          a.href = u; a.download = ""; document.body.appendChild(a); a.click(); a.remove();
        }
      }
    } catch (e) {
      setError(e?.message || "Could not generate flyers");
    } finally {
      setFlyerBusy(false);
    }
  }

  return (
    <div className="chat-page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">LG</div>
          <div className="title">ListGenie.ai</div>
          <div className={`plan ${isPro ? "pro" : "free"}`}>{isPro ? "Pro" : "Free"}</div>
        </div>
        <div className="hint">Generate listings, captions, and flyers</div>
      </header>

      <main className="container">
        <section className="controls">
          <div className="row1">
            <button className="flyer-btn" onClick={openFlyerModal}>
              {isPro ? "Create Flyers" : "Flyers (Pro)"}
            </button>
            <TonePill value="mls" label="MLS-ready" current={tone} onChange={setTone} />
            <TonePill value="social" label="Social caption" current={tone} onChange={setTone} />
            <TonePill value="luxury" label="Luxury tone" current={tone} onChange={setTone} />
            <TonePill value="concise" label="Concise" current={tone} onChange={setTone} />
          </div>
          <div className="examples">
            {examples.map((ex, i) => (
              <button key={i} className="example" onClick={() => setInput(ex.text)}>
                {ex.label}
              </button>
            ))}
          </div>
        </section>

        <section className="messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="empty">Start by pasting a property description, or choose an example above.</div>
          )}

          {messages.map((m, i) => {
            const isAssistant = m.role === "assistant";
            const readable = coerceToReadableText(m.pretty ?? m.content);
            const variants = isAssistant ? splitVariants(readable) : null;

            return (
              <div key={i} className={`row ${isAssistant ? "ai" : "you"}`}>
                <div className="author">{isAssistant ? "ListGenie" : "You"}</div>
                <div className="bubble">
                  {isAssistant ? (
                    <div className="assistant-block">
                      {/* Global copy for full response */}
                      <div className="copy-all">
                        <button
                          className="copy-btn"
                          onClick={async () => { await copyToClipboard(readable); }}
                          title="Copy full response"
                        >Copy all</button>
                      </div>

                      {variants ? (
                        <div className="variants">
                          {Object.entries(variants).map(([k, v]) => (
                            <div className={`variant ${k}`} key={k}>
                              <div className="variant-head">
                                <span className="variant-chip">{displayName(k)}</span>
                                <button
                                  className="copy-btn sm"
                                  title={`Copy ${displayName(k)}`}
                                  onClick={async () => { await copyToClipboard(v.trim()); }}
                                >Copy</button>
                              </div>
                              <div className="variant-body prose prose-invert whitespace-pre-wrap leading-relaxed">{v.trim()}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="prose prose-invert whitespace-pre-wrap leading-relaxed">{readable}</div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && <ThinkingDots />}
          {error && <div className="error">{error}</div>}
        </section>

        <section className="composer">
          <textarea
            rows={3}
            placeholder="Paste a property description or type details…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="send" disabled={loading || !input.trim()} onClick={handleSend}>
            {loading ? "Generating…" : "Send"}
          </button>
        </section>
      </main>

      {flyerOpen && (
        <div className="modal">
          <div className="scrim" onClick={() => setFlyerOpen(false)} />
          <div className="sheet">
            <div className="sheet-head">
              <div className="sheet-title">Generate Flyers</div>
              <button className="x" onClick={() => setFlyerOpen(false)}>✕</button>
            </div>

            {!isPro ? (
              <div className="sheet-body">
                Flyers are a Pro feature. Upgrade to create Standard and Open House PDFs.
              </div>
            ) : (
              <div className="sheet-body">
                <p>Choose flyer types to generate from the latest assistant output.</p>
                <label className="check"><input type="checkbox" checked={flyerTypes.standard} onChange={(e) => setFlyerTypes((s) => ({ ...s, standard: e.target.checked }))} /> Standard Flyer</label>
                <label className="check"><input type="checkbox" checked={flyerTypes.openHouse} onChange={(e) => setFlyerTypes((s) => ({ ...s, openHouse: e.target.checked }))} /> Open House Flyer</label>
                <div className="actions">
                  <button className="btn" onClick={() => setFlyerOpen(false)}>Cancel</button>
                  <button className="btn primary" onClick={generateFlyers} disabled={flyerBusy || (!flyerTypes.standard && !flyerTypes.openHouse)}>
                    {flyerBusy ? "Generating…" : "Generate PDFs"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        :root {
          --bg: #0a0d14;
          --bg-soft: #0f1320;
          --card: #0d111a;
          --stroke: #2a3242;
          --text: #e6e9ef;
          --text-dim: #9aa4b2;
          --indigo: #6366f1;
          --indigo-ghost: rgba(99,102,241,0.14);
          --emerald-ghost: rgba(16,185,129,0.14);
          --rose: #f43f5e;
        }
        .chat-page { min-height: 100vh; background: radial-gradient(1200px 800px at 20% -10%, rgba(42,60,106,.5), transparent 60%), radial-gradient(900px 700px at 100% 0%, rgba(23,38,97,.35), transparent 50%), var(--bg); color: var(--text); }
        .topbar { position: sticky; top: 0; z-index: 20; backdrop-filter: saturate(120%) blur(6px); background: rgba(8,11,18,0.6); border-bottom: 1px solid rgba(80,90,120,0.35); }
        .topbar .brand { display: flex; gap: 10px; align-items: center; padding: 10px 16px; }
        .topbar .logo { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--indigo-ghost); border: 1px solid rgba(99,102,241,0.35); font-weight: 800; font-size: 12px; letter-spacing: .08em; }
        .topbar .title { font-weight: 600; }
        .topbar .plan { margin-left: 6px; font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--stroke); color: var(--text-dim); }
        .topbar .plan.pro { border-color: rgba(16,185,129,0.5); color: #7ce7c4; }
        .topbar .hint { margin-left: auto; padding-right: 16px; font-size: 12px; color: var(--text-dim); }

        .container { max-width: 960px; margin: 0 auto; padding: 16px; display: grid; gap: 12px; }
        .controls { border: 1px solid var(--stroke); background: rgba(16,20,32,0.5); border-radius: 16px; padding: 12px; }
        .row1 { display: flex; gap: 8px; align-items: center; }
        .flyer-btn { border: 1px solid var(--stroke); background: var(--emerald-ghost); color: #c4f6e6; padding: 8px 12px; border-radius: 999px; font-size: 13px; }

        .examples { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }
        .example { border: 1px solid var(--stroke); color: var(--text); background: rgba(20,24,36,0.5); padding: 6px 10px; border-radius: 999px; font-size: 12px; }

        .messages { border: 1px solid var(--stroke); background: rgba(14,18,28,0.4); border-radius: 16px; padding: 10px; min-height: 40vh; max-height: 62vh; overflow: auto; }
        .empty { text-align: center; color: var(--text-dim); font-size: 14px; padding: 40px 0; }

        .row { display: grid; grid-template-columns: 80px 1fr; gap: 10px; margin-bottom: 12px; }
        .row.you .author { color: #b6c1d1; }
        .row.ai .author { color: #86a2ff; }
        .author { font-size: 12px; letter-spacing: .02em; padding-top: 10px; }
        .bubble { border: 1px solid var(--stroke); background: rgba(12,16,26,0.6); border-radius: 16px; padding: 12px; }

        .assistant-block { position: relative; }
        .copy-all { position: absolute; top: -6px; right: -6px; }
        .copy-btn { border: 1px solid var(--stroke); background: rgba(28,32,44,0.8); color: var(--text); font-size: 12px; padding: 4px 8px; border-radius: 8px; }
        .copy-btn.sm { font-size: 11px; padding: 3px 6px; }

        .variants { display: grid; gap: 8px; }
        .variant { border: 1px solid var(--stroke); background: rgba(20,22,30,0.5); border-radius: 12px; }
        .variant .variant-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 10px 0 10px; }
        .variant .variant-body { padding: 10px; }
        .variant-chip { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); border: 1px solid var(--stroke); padding: 2px 8px; border-radius: 999px; }
        .variant.mls .variant-chip { color: #bcd3ff; border-color: rgba(99,102,241,0.5); }
        .variant.social .variant-chip { color: #f8d68e; border-color: rgba(234,179,8,0.45); }
        .variant.luxury .variant-chip { color: #f0c6ff; border-color: rgba(168,85,247,0.5); }
        .variant.concise .variant-chip { color: #b0f3d2; border-color: rgba(16,185,129,0.45); }

        .composer { display: grid; grid-template-columns: 1fr 120px; gap: 8px; }
        .composer textarea { background: rgba(12,16,26,0.6); border: 1px solid var(--stroke); color: var(--text); border-radius: 12px; padding: 10px; min-height: 76px; resize: vertical; }
        .composer .send { border: 1px solid rgba(99,102,241,0.5); background: var(--indigo-ghost); color: #d9dbff; border-radius: 12px; }

        .error { text-align: center; color: #ff9db0; font-size: 13px; margin: 6px 0; }

        /* --- Thinking dots --- */
        .thinking { display: inline-grid; grid-auto-flow: column; gap: 6px; align-items: center; margin: 10px; }
        .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--text-dim); animation: bounce 1.2s infinite ease-in-out; }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.12s; }
        .dot:nth-child(3) { animation-delay: 0.24s; }
        .thinking-label { font-size: 12px; color: var(--text-dim); }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-4px); opacity: 1; } }

        /* --- Modal --- */
        .modal { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; }
        .scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
        .sheet { position: relative; z-index: 10; width: 100%; max-width: 480px; background: var(--card); border: 1px solid var(--stroke); border-radius: 16px; overflow: hidden; }
        .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--stroke); }
        .sheet-title { font-weight: 600; }
        .sheet-body { padding: 12px; display: grid; gap: 10px; }
        .check { display: flex; gap: 8px; align-items: center; }
        .actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; }
        .btn { border: 1px solid var(--stroke); background: rgba(18,22,32,0.7); color: var(--text); border-radius: 10px; padding: 8px 12px; }
        .btn.primary { border-color: rgba(16,185,129,0.5); background: var(--emerald-ghost); color: #c4f6e6; }
        .x { border: 1px solid var(--stroke); background: rgba(18,22,32,0.7); color: var(--text); border-radius: 8px; padding: 4px 8px; }
      `}</style>
    </div>
  );
}

/** ---------------- Small bits ---------------- */
function TonePill({ value, label, current, onChange }) {
  const active = current === value;
  return (
    <button
      className="tone-pill"
      onClick={() => onChange(value)}
      style={{
        border: `1px solid ${active ? "rgba(99,102,241,0.6)" : "var(--stroke)"}`,
        background: active ? "var(--indigo-ghost)" : "rgba(20,24,36,0.5)",
        color: active ? "#d9dbff" : "var(--text)",
        borderRadius: 9999,
        padding: "8px 12px",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

function displayName(key) {
  return key === "mls" ? "MLS-Ready" : key === "social" ? "Social Caption" : key === "luxury" ? "Luxury Tone" : key === "concise" ? "Concise" : key;
}

function ThinkingDots() {
  return (
    <div className="thinking">
      <div className="dot" /><div className="dot" /><div className="dot" />
      <span className="thinking-label">Thinking…</span>
    </div>
  );
}
