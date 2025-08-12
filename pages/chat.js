// pages/chat.js — ListGenie.ai (enhanced)
// - Restored dark UI
// - Streaming chat with readable output cleanup
// - Variant detection & styled cards (MLS / Social / Luxury / Concise)
// - Copy-to-clipboard buttons for each variant and full response (with “Copied!” state)
// - Pro-gated flyer modal (Standard + Open House)
// - Downloads PDF via /api/flyer

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import useUserPlan from "@/hooks/useUserPlan";

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
  const { isPro, isTrial, isExpired, daysLeft, refreshPlan, canGenerate, plan, trialEnd } = useUserPlan();

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

  // Copy state (for "Copied!" UI)
  const [copiedKey, setCopiedKey] = useState(null);
  async function handleCopy(key, text) {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  }

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

    // Check if user can generate
    if (!canGenerate) {
      setError("Your trial has expired. Please upgrade to Pro to continue using ListGenie.");
      return;
    }

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
      <header className="main-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="logo">LG</div>
            <div className="title">ListGenie.ai</div>
            <div className="plan-badge">
              {isPro ? "Pro" : isTrial ? "Trial" : "Expired"}
            </div>
          </div>
          <div className="tagline">Generate listings, captions, and flyers</div>
          <div className="plan-status">
            {isTrial ? (
              <span className="trial-status">{daysLeft} days left in trial</span>
            ) : !isPro ? (
              <span className="expired-status">Trial expired</span>
            ) : (
              <span className="pro-status">Pro Plan Active</span>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <section className="controls">
          <div className="row1">
            <button className="flyer-btn" onClick={openFlyerModal}>
              {isPro ? "Create Flyers" : "Flyers (Pro)"}
            </button>
            <div className="tone-separator"></div>
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
                          onClick={() => handleCopy(`all-${i}`, readable)}
                          title="Copy full response"
                        >
                          {copiedKey === `all-${i}` ? "Copied!" : "Copy all"}
                        </button>
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
                                  onClick={() => handleCopy(`var-${i}-${k}`, v.trim())}
                                >
                                  {copiedKey === `var-${i}-${k}` ? "Copied!" : "Copy"}
                                </button>
                              </div>
                              <div className="variant-body prose prose-invert whitespace-pre-wrap leading-relaxed">
                                {v.trim()}
                              </div>
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
        <div className="flyer-modal">
          <div className="flyer-modal-content">
            <div className="flyer-modal-header">
              <h2 className="flyer-modal-title">Generate Flyers</h2>
              <button className="flyer-modal-close" onClick={() => setFlyerOpen(false)}>✕</button>
            </div>
            <p className="flyer-modal-description">
              Choose flyer types to generate from the latest assistant output.
            </p>
            <div className="flyer-options">
              <label className="flyer-option">
                <input
                  type="checkbox"
                  checked={flyerTypes.standard}
                  onChange={(e) => setFlyerTypes((s) => ({ ...s, standard: e.target.checked }))}
                />{" "}
                Standard Flyer
              </label>
              <label className="flyer-option">
                <input
                  type="checkbox"
                  checked={flyerTypes.openHouse}
                  onChange={(e) => setFlyerTypes((s) => ({ ...s, openHouse: e.target.checked }))}
                />{" "}
                Open House Flyer
              </label>
            </div>
            <div className="flyer-modal-actions">
              <button className="flyer-modal-btn cancel" onClick={() => setFlyerOpen(false)}>Cancel</button>
              <button
                className="flyer-modal-btn generate"
                onClick={generateFlyers}
                disabled={flyerBusy || (!flyerTypes.standard && !flyerTypes.openHouse)}
              >
                {flyerBusy ? "Generating…" : "Generate PDFs"}
              </button>
            </div>
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

  /* Page background & typography */
  .chat-page {
    min-height: 100vh;
    background:
      radial-gradient(1200px 800px at 20% -10%, rgba(42,60,106,.45), transparent 60%),
      radial-gradient(900px 700px at 100% 0%, rgba(23,38,97,.30), transparent 50%),
      var(--bg);
    color: var(--text);
  }

  /* Top bar */
  .main-header {
    background: linear-gradient(135deg, rgba(14,18,28,0.95), rgba(10,13,20,0.95));
    border: 1px solid rgba(80,90,120,0.3);
    border-radius: 16px;
    margin: 24px auto;
    max-width: 800px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .header-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  .brand-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .main-header .logo {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 14px;
  }
  
  .main-header .title {
    font-weight: 700;
    font-size: 18px;
    color: #e6e9ef;
  }
  
  /* Premium tagline */
  .main-header .tagline {
    font-size: 14px;
    color: #9aa4b2;
    text-align: center;
    padding: 8px 16px;
    background: rgba(20, 24, 36, 0.6);
    border: 1px solid rgba(80, 90, 120, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    margin: 8px auto;
    width: fit-content;
    max-width: 400px;
    display: block;
  }
  
  .plan-status {
    text-align: center;
    margin-top: 8px;
  }
  
  .plan-status span {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .trial-status {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.2));
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }
  
  .expired-status {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .pro-status {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  /* Main layout */
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Controls card */
  .controls {
    border: 1px solid var(--stroke);
    background: rgba(14,18,28,0.65);
    border-radius: 14px;
    padding: 16px;
  }
  .row1 { 
    display: flex; 
    gap: 8px; 
    align-items: center; 
    flex-wrap: wrap; 
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .flyer-btn {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.15));
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
  
  .flyer-btn:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.25));
    border-color: rgba(99, 102, 241, 0.5);
    color: #c7d2fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }
  
  .flyer-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
  
  .tone-separator {
    width: 1px;
    height: 24px;
    background: linear-gradient(180deg, transparent, rgba(80, 90, 120, 0.4), transparent);
    margin: 0 16px;
  }

  /* Examples section */
  .examples { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 8px; 
  }
  .examples::before {
    content: "Examples:";
    display: block;
    width: 100%;
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 8px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .example { 
    border: 1px solid rgba(255,255,255,0.15); 
    color: var(--text); 
    background: rgba(20,24,36,0.6); 
    padding: 8px 12px; 
    border-radius: 8px; 
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .example:hover {
    background: rgba(30,34,46,0.8);
    border-color: rgba(255,255,255,0.25);
    transform: translateY(-1px);
  }

  /* Messages panel */
  .messages {
    border: 1px solid var(--stroke);
    background: rgba(12,16,24,0.72);
    border-radius: 14px;
    padding: 10px;
    min-height: 42vh;
    max-height: 58vh;   /* keeps composer visible */
    overflow: auto;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02), inset 0 -1px 0 rgba(0,0,0,0.25);
  }
  .empty { text-align: center; color: var(--text-dim); font-size: 14px; padding: 28px 0; }

  /* Message rows */
  .row { display: grid; grid-template-columns: 72px 1fr; gap: 10px; margin-bottom: 10px; }
  .row.you .author { color: #b6c1d1; }
  .row.ai  .author { color: #86a2ff; }
  .author { font-size: 12px; letter-spacing: .02em; padding-top: 10px; }

  .bubble {
    border: 1px solid var(--stroke);
    background: rgba(11,14,22,0.85);
    border-radius: 14px;
    padding: 10px;
  }

  /* Assistant extras */
  .assistant-block { position: relative; }
  .copy-all { position: absolute; top: -6px; right: -6px; }
  .copy-btn {
    border: 1px solid var(--stroke);
    background: rgba(30,36,52,0.9);
    color: var(--text);
    font-size: 12px; padding: 4px 8px; border-radius: 8px;
    transition: transform .06s ease, background .15s ease, border-color .15s ease;
  }
  .copy-btn:hover { transform: translateY(-1px); background: rgba(36,42,60,0.95); border-color: rgba(99,102,241,0.5); }
  .copy-btn.sm { font-size: 11px; padding: 3px 6px; }

  /* Variants */
  .variants { display: grid; gap: 8px; }
  .variant {
    border: 1px solid var(--stroke);
    background: rgba(16,19,28,0.75);
    border-radius: 12px;
  }
  .variant .variant-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 0 10px; }
  .variant .variant-body { padding: 8px 10px 10px; }
  .variant-chip {
    font-size: 10px; text-transform: uppercase; letter-spacing: .08em;
    color: var(--text-dim); border: 1px solid var(--stroke); padding: 2px 8px; border-radius: 999px;
  }
  .variant.mls .variant-chip    { color: #bcd3ff; border-color: rgba(99,102,241,0.5); }
  .variant.social .variant-chip { color: #f8d68e; border-color: rgba(234,179,8,0.45); }
  .variant.luxury .variant-chip { color: #f0c6ff; border-color: rgba(168,85,247,0.5); }
  .variant.concise .variant-chip{ color: #b0f3d2; border-color: rgba(16,185,129,0.45); }

  /* Composer (sticky bottom) */
  .composer {
    position: sticky; bottom: 0;
    background: linear-gradient(to top, rgba(5,7,11,0.85), rgba(5,7,11,0.0));
    backdrop-filter: blur(6px) saturate(120%);
    display: grid; grid-template-columns: 1fr 120px; gap: 8px;
    padding-top: 6px;
  }
  .composer textarea {
    background: rgba(12,16,26,0.88);
    border: 1px solid rgba(86,96,120,0.55);
    color: var(--text);
    border-radius: 12px;
    padding: 12px;
    min-height: 74px;
    resize: vertical;
    box-shadow: 0 4px 28px rgba(0,0,0,0.28);
  }
  .composer textarea::placeholder { color: rgba(200,208,220,0.45); }
  .composer .send {
    border: 1px solid rgba(99,102,241,0.55);
    background: var(--indigo-ghost);
    color: #e6e9ff;
    border-radius: 12px;
    font-weight: 600;
    box-shadow: 0 4px 24px rgba(62,74,140,0.25);
  }

  /* Errors & thinking dots */
  .error { text-align: center; color: #ff9db0; font-size: 13px; margin: 6px 0; }
  .thinking { display: inline-grid; grid-auto-flow: column; gap: 6px; align-items: center; margin: 10px; }
  .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--text-dim); animation: bounce 1.2s infinite ease-in-out; }
  .dot:nth-child(1) { animation-delay: 0s; }
  .dot:nth-child(2) { animation-delay: 0.12s; }
  .dot:nth-child(3) { animation-delay: 0.24s; }
  .thinking-label { font-size: 12px; color: var(--text-dim); }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-4px); opacity: 1; } }

  /* Tone pills styling */
  .tone-pill {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  
  .tone-pill::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.1));
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .tone-pill:hover::before {
    opacity: 1;
  }
  
  .tone-pill.active {
    background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2));
    border-color: rgba(99,102,241,0.4);
    color: #d9dbff;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.2);
  }
  
  .tone-pill span {
    position: relative;
    z-index: 1;
  }

  /* Clerk Modal Styling Fixes */
  :global(.cl-modal) {
    background: rgba(10, 13, 20, 0.95) !important;
    backdrop-filter: blur(20px) !important;
  }
  
  :global(.cl-modal .cl-card) {
    background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(10, 13, 20, 0.95)) !important;
    border: 1px solid rgba(80, 90, 120, 0.3) !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
  }
  
  :global(.cl-modal .cl-cardHeader) {
    background: transparent !important;
  }
  
  :global(.cl-modal .cl-cardHeaderTitle) {
    color: #e6e9ef !important;
  }
  
  :global(.cl-modal .cl-cardHeaderSubtitle) {
    color: #9aa4b2 !important;
  }
  
  :global(.cl-modal .cl-formField) {
    background: rgba(20, 24, 36, 0.8) !important;
    border: 1px solid rgba(80, 90, 120, 0.4) !important;
    border-radius: 12px !important;
  }
  
  :global(.cl-modal .cl-formFieldInput) {
    background: transparent !important;
    color: #e6e9ef !important;
    border: none !important;
    outline: none !important;
  }
  
  :global(.cl-modal .cl-formFieldInput::placeholder) {
    color: #9aa4b2 !important;
  }
  
  :global(.cl-modal .cl-formButtonPrimary) {
    background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
    border: none !important;
    color: white !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
  }
  
  :global(.cl-modal .cl-formButtonPrimary:hover) {
    background: linear-gradient(135deg, #4f46e5, #4338ca) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4) !important;
  }
  
  :global(.cl-modal .cl-socialButtonsBlockButton) {
    background: rgba(20, 24, 36, 0.8) !important;
    border: 1px solid rgba(80, 90, 120, 0.4) !important;
    color: #e6e9ef !important;
    border-radius: 12px !important;
    font-weight: 500 !important;
  }
  
  :global(.cl-modal .cl-socialButtonsBlockButton:hover) {
    background: rgba(30, 34, 46, 0.9) !important;
    border-color: rgba(80, 90, 120, 0.6) !important;
  }
  
  :global(.cl-modal .cl-dividerLine) {
    background: rgba(80, 90, 120, 0.4) !important;
  }
  
  :global(.cl-modal .cl-dividerText) {
    color: #9aa4b2 !important;
    background: rgba(10, 13, 20, 0.95) !important;
  }
  
  :global(.cl-modal .cl-footerAction) {
    color: #9aa4b2 !important;
  }
  
  :global(.cl-modal .cl-footerActionLink) {
    color: #86a2ff !important;
    text-decoration: none !important;
  }
  
  :global(.cl-modal .cl-footerActionLink:hover) {
    color: #a5b4fc !important;
    text-decoration: underline !important;
  }
  
  :global(.cl-modal .cl-closeButton) {
    color: #9aa4b2 !important;
    background: rgba(20, 24, 36, 0.8) !important;
    border: 1px solid rgba(80, 90, 120, 0.4) !important;
    border-radius: 8px !important;
  }
  
  :global(.cl-modal .cl-closeButton:hover) {
    background: rgba(30, 34, 46, 0.9) !important;
    color: #e6e9ef !important;
  }
  
  /* Additional Clerk fixes */
  :global(.cl-modal .cl-formFieldLabel) {
    color: #e6e9ef !important;
    font-weight: 500 !important;
  }
  
  :global(.cl-modal .cl-formFieldInput:focus) {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3) !important;
  }
  
  :global(.cl-modal .cl-formFieldInput:focus-within) {
    border-color: rgba(99, 102, 241, 0.6) !important;
  }
  
  :global(.cl-modal .cl-formFieldError) {
    color: #f87171 !important;
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    margin-top: 8px !important;
  }
  
  :global(.cl-modal .cl-formFieldSuccess) {
    color: #34d399 !important;
    background: rgba(52, 211, 153, 0.1) !important;
    border: 1px solid rgba(52, 211, 153, 0.3) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    margin-top: 8px !important;
  }
  
  /* Clerk backdrop and animations */
  :global(.cl-modalBackdrop) {
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(8px) !important;
  }
  
  :global(.cl-modalContent) {
    animation: modalSlideIn 0.3s ease-out !important;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .plan-badge {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
  
  /* Clerk Modal Dark Theme Overrides */
  .flyer-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .flyer-modal-content {
    background: linear-gradient(135deg, rgba(14, 18, 28, 0.95), rgba(10, 13, 20, 0.95));
    border: 1px solid rgba(80, 90, 120, 0.4);
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    position: relative;
  }
  
  .flyer-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .flyer-modal-title {
    font-size: 20px;
    font-weight: 700;
    color: #e6e9ef;
    margin: 0;
  }
  
  .flyer-modal-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #9aa4b2;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
  }
  
  .flyer-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #e6e9ef;
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .flyer-modal-description {
    color: #9aa4b2;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  
  .flyer-options {
    margin-bottom: 24px;
  }
  
  .flyer-option {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .flyer-option:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .flyer-option input[type="checkbox"] {
    margin-right: 12px;
    width: 18px;
    height: 18px;
    accent-color: #6366f1;
  }
  
  .flyer-option label {
    color: #e6e9ef;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
  }
  
  .flyer-modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .flyer-modal-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 14px;
  }
  
  .flyer-modal-btn.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #9aa4b2;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .flyer-modal-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #e6e9ef;
  }
  
  .flyer-modal-btn.generate {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  .flyer-modal-btn.generate:hover {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  }
`}</style>
    </div>
  );
}

/** ---------------- Small bits ---------------- */
function TonePill({ value, label, current, onChange }) {
  const active = current === value;
  return (
    <button
      className={`tone-pill ${active ? 'active' : ''}`}
      onClick={() => onChange(value)}
    >
      <span>{label}</span>
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