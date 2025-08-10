import { useEffect, useMemo, useRef, useState } from "react";
import ProGate from "@/components/ProGate";
import ListingRender from "@/components/ListingRender";

const TONES = [
  { key: "mls", label: "MLS-ready", hint: "Use clean, compliant MLS phrasing." },
  { key: "social", label: "Social caption", hint: "Craft a short, scroll-stopping caption." },
  { key: "luxury", label: "Luxury tone", hint: "Elevate language for a higher-end audience." },
  { key: "concise", label: "Concise", hint: "Keep it tight, punchy, and skimmable." },
];

// tiny toast helper
function useToast() {
  const [toast, setToast] = useState(null); // {msg, type:'ok'|'err'}
  const show = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };
  const ui = toast ? (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "10px 14px",
        borderRadius: 10,
        background: toast.type === "ok" ? "rgba(56,176,0,.18)" : "rgba(255,99,99,.18)",
        border: `1px solid ${toast.type === "ok" ? "rgba(56,176,0,.55)" : "rgba(255,99,99,.55)"}`,
        backdropFilter: "blur(6px)",
        zIndex: 1000,
      }}
    >
      {toast.msg}
    </div>
  ) : null;
  return [ui, show];
}

function coerceToReadableText(content) {
  // If it's already a string, try to see if it's JSON-in-a-string
  if (typeof content === "string") {
    try {
      const maybe = JSON.parse(content);
      return coerceToReadableText(maybe);
    } catch {
      return content; // plain text
    }
  }

  // If it's a structured object, extract nice text
  if (content && typeof content === "object") {
    // Common shape we saw from your API:
    // { type: 'listing', headline, mls: { body, bullets[] }, variants: [{label,text}, ...], facts: {...} }
    const parts = [];

    if (content.headline) {
      parts.push(content.headline);
      parts.push(""); // blank line
    }

    if (content.mls?.body) {
      parts.push(content.mls.body.trim());
      parts.push("");
    }

    if (Array.isArray(content.mls?.bullets) && content.mls.bullets.length) {
      for (const b of content.mls.bullets) {
        if (typeof b === "string") parts.push(`- ${b}`);
        else if (b && typeof b === "object") {
          // bullet objects with 'text' or similar
          const text = b.text || b.label || "";
          if (text) parts.push(`- ${text}`);
        }
      }
      parts.push("");
    }

    if (Array.isArray(content.variants) && content.variants.length) {
      for (const v of content.variants) {
        const label = v?.label || "Variant";
        const text = v?.text || v?.body || "";
        if (text) {
          parts.push(`${label}: ${text}`);
        }
      }
      parts.push("");
    }

    // Fallback: stringify any remaining object if we still have nothing
    if (!parts.join("\n").trim()) {
      try { return JSON.stringify(content, null, 2); } catch { return String(content); }
    }

    return parts.join("\n");
  }

  // Last resort
  return String(content ?? "");
}

export default function ChatPage() {
  // plan + trial
  const [plan, setPlan] = useState("trial"); // 'trial' | 'pro' | 'expired'
  const [trialEnd, setTrialEnd] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // chat state
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("mls");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing. You can also paste bullet points.",
    },
  ]);
  const streamRef = useRef(null);
  const listRef = useRef(null);
  const [Toast, showToast] = useToast();

  // get plan
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/user/plan");
        const j = await r.json();
        if (alive) {
          setPlan(j?.plan || "trial");
          setTrialEnd(j?.trial_end_date || null);
        }
      } catch (_) {
        // ignore; default trial
      } finally {
        if (alive) setLoadingPlan(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // scroll to latest message
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const trialDaysLeft = useMemo(() => {
    if (!trialEnd) return null;
    const ms = new Date(trialEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [trialEnd]);

  const headerBadge = useMemo(() => {
    if (loadingPlan) return null;
    if (plan === "pro")
      return <span className="badge" style={{ marginLeft: 10 }}>Pro</span>;
    if (plan === "trial")
      return (
        <span className="badge" style={{ marginLeft: 10 }}>
          Trial{trialDaysLeft != null ? ` • ${trialDaysLeft}d left` : ""}
        </span>
      );
    return (
      <span className="badge" style={{ marginLeft: 10 }}>
        Expired
      </span>
    );
  }, [plan, loadingPlan, trialDaysLeft]);

  const disabled = !input.trim() || sending || plan === "expired";

  const baseSystem = `You are ListGenie.ai — a real-estate listing specialist.
Write polished, MLS-ready listings and short social variants.
Respect fair housing, avoid superlatives that imply discrimination, and focus on property facts and benefits.`;

  const toneNote = (() => {
    switch (tone) {
      case "social":
        return "Create a short social caption (1–2 sentences) with a hook and a soft CTA. Keep emojis tasteful.";
      case "luxury":
        return "Elevate the language for a luxury audience. Warm, refined, and specific — avoid cliché realtor jargon.";
      case "concise":
        return "Be concise (120–180 words). Prioritize top features; remove fluff.";
      default:
        return "Produce an MLS-ready description that’s clear, factual, and compelling.";
    }
  })();

  // quick action helpers
  const applyQuick = (q) => {
    setInput((s) => (s ? `${s}\n\n${q}` : q));
  };

  // Save to listings (used from pretty render)
  const saveListing = async (aiText, prompt) => {
    try {
      const title = (prompt || "").split("\n")[0].slice(0, 80) || "Generated listing";
      const payload = {
        tone,
        prompt,
        output: aiText,
        created_at: new Date().toISOString(),
      };
      const r = await fetch("/api/listings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, payload }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      showToast("Saved to Listings");
    } catch (e) {
      showToast(e.message || "Save failed", "err");
    }
  };

  const send = async () => {
    if (disabled) return;
  
    const userMsg = { role: "user", content: input.trim(), ts: Date.now() };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "", streaming: true, ts: Date.now() }]);
    setInput("");
    setSending(true);
  
    try {
      // short history for continuity
      const hist = messages
        .slice(-6)
        .filter((x) => x.role === "user" || x.role === "assistant")
        .map((x) => ({ role: x.role, content: (x.content || "").slice(0, 2000) }));
  
      const sys = `${baseSystem}\n\nTone guidance: ${toneNote}`;
      const assembledMessages = [
        { role: "system", content: sys },
        ...hist,
        { role: "user", content: userMsg.content },
      ];
  
      const body = {
        input: userMsg.content,     // legacy
        system: sys,                // legacy
        tone,
        history: hist,              // legacy
        messages: assembledMessages // chat-style
      };
  
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        let msg = txt;
        try { const j = JSON.parse(txt); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg || `HTTP ${r.status}`);
      }
  
      const ctype = r.headers.get("content-type") || "";
  
      // If server replies with JSON, parse it and show pretty text (no streaming)
      if (ctype.includes("application/json")) {
        const txt = await r.text();
        let j = {};
        try { j = JSON.parse(txt || "{}"); } catch {}
        const rawContent = j?.message?.content ?? j?.content ?? j?.text ?? j;
        const pretty = coerceToReadableText(rawContent);
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: pretty, streaming: false, ts: Date.now() };
          return next;
        });
        return;
      }
  
      // Otherwise, treat as a streaming text response
      if (!r.body || !r.body.getReader) {
        const txt = await r.text().catch(() => "");
        let msg = txt;
        try { const j = JSON.parse(txt); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg || "Server did not return a stream");
      }
  
      const reader = r.body.getReader();
      streamRef.current = reader;
  
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        acc += chunk;
        setMessages((m) => {
          const last = m[m.length - 1];
          if (!last || last.role !== "assistant") return m;
          const next = [...m];
          next[next.length - 1] = { ...last, content: acc, streaming: true };
          return next;
        });
      }
  
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, streaming: false };
        return next;
      });
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${e.message || "Failed to generate."}` },
      ]);
    } finally {
      setSending(false);
      streamRef.current = null;
    }
  };

  // stop streaming if needed
  const stop = async () => {
    try {
      streamRef.current?.cancel();
    } catch {}
    setSending(false);
    setMessages((m) => {
      const next = [...m];
      const last = next[next.length - 1];
      if (last?.role === "assistant") next[next.length - 1] = { ...last, streaming: false };
      return next;
    });
  };

  // get the most recent user prompt for save title/context
  const lastUserPrompt = useMemo(
    () => [...messages].reverse().find((x) => x.role === "user")?.content || "",
    [messages]
  );

  return (
    <div className="chat-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div className="chat-title">ListGenie.ai Chat</div>
        {headerBadge}
      </div>
      <div className="chat-sub" style={{ marginBottom: 14 }}>
        Generate polished real estate listings plus social variants.
      </div>

      {/* tone chips */}
      <div className="card" style={{ padding: 10, marginBottom: 10 }}>
        <div className="chat-sub" style={{ marginBottom: 6 }}>Tone</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TONES.map((t) => (
            <button
              key={t.key}
              className="btn"
              onClick={() => setTone(t.key)}
              style={{
                padding: "6px 10px",
                background: tone === t.key ? "rgba(255,255,255,.08)" : undefined,
              }}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* suggestion chips */}
      <div className="card" style={{ padding: 10, marginBottom: 10 }}>
        <div className="chat-sub" style={{ marginBottom: 6 }}>Try one of these:</div>
        <div style={{ display: "grid", gap: 8 }}>
          <button className="textarea" onClick={() => setInput("3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.")}>
            3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.
          </button>
          <button className="textarea" onClick={() => setInput("Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.")}>
            Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.
          </button>
          <button className="textarea" onClick={() => setInput("Country property: 5 acres, 4 stall barn, seasonal creek, updated HVAC, fenced garden.")}>
            Country property: 5 acres, 4 stall barn, seasonal creek, updated HVAC, fenced garden.
          </button>
        </div>
      </div>

      {/* messages */}
      <div ref={listRef} className="card" style={{ padding: 12, height: "38vh", overflowY: "auto", marginBottom: 10 }}>
        {messages.map((m, i) => {
          if (m.role === "system") {
            return (
              <div key={i} className="card" style={{ padding: 10, marginBottom: 8 }}>
                {m.content}
              </div>
            );
          }
          if (m.role === "user") {
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div className="badge" style={{ marginBottom: 6 }}>You</div>
                <div className="textarea" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            );
          }
          // assistant
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div className="badge">ListGenie</div>
                {m.streaming && <div className="chat-sub">…generating</div>}
              </div>

              {m.streaming ? (
                <div className="textarea" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              ) : (
                <ListingRender
                  title={(lastUserPrompt || "").split("\n")[0].slice(0, 80) || "Generated Listing"}
                  content={m.content}
                  meta={{ tone, created_at: new Date(m.ts || Date.now()).toISOString() }}
                  onSave={(text) => saveListing(text, lastUserPrompt)}
                />
              )}
            </div>
          );
        })}
        {!messages.length && <div className="chat-sub">No messages yet.</div>}
      </div>

      {/* quick actions row */}
      <div className="card" style={{ padding: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="link" onClick={() => applyQuick("Please shorten to an MLS-friendly length and keep it factual.")}>
            Shorter MLS
          </button>
          <button className="link" onClick={() => applyQuick("Create a short social caption version with a soft call-to-action.")}>
            Social caption
          </button>
          <button className="link" onClick={() => applyQuick("Elevate the tone slightly for a luxury audience without sounding cliché.")}>
            Luxury tone
          </button>
          <button className="link" onClick={() => applyQuick("What follow-up details should I collect from the seller to improve this?")}>
            Ask follow-ups
          </button>
        </div>
      </div>

      {/* input */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <textarea
          className="textarea"
          placeholder="Describe the property and any highlights…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          style={{ flex: 1 }}
        />
        {sending ? (
          <button className="btn" onClick={stop}>Stop</button>
        ) : (
          <button className="btn" onClick={send} disabled={disabled}>Send</button>
        )}
      </div>

      {/* gate if expired */}
      {plan === "expired" && (
        <div style={{ marginTop: 10 }}>
          <ProGate />
        </div>
      )}

      {Toast}
    </div>
  );
}