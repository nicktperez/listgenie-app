// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ListingRender, QuestionsRender } from "@/components/ListingRender";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const FREE_CHAR_LIMIT = 1400; // not actively used with trial, but kept for safety if you reintroduce free gating
const AUTOSAVE = true;        // set false if you only want manual "Save Listing"

export default function ChatPage() {
  return (
    <div className="chat-wrap">
      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <p className="chat-sub" style={{ marginBottom: 8 }}>
            Please sign in to start generating listings.
          </p>
          <SignInButton mode="modal">
            <button className="btn">Sign in with Clerk</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <ChatInner />
      </SignedIn>
    </div>
  );
}

function ChatInner() {
  const { plan, isPro, isTrial, isExpired, daysLeft } = useUserPlan();

  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      content:
        "Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing.",
      parsed: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const endRef = useRef(null);
  const textRef = useRef(null);

  // Scroll to bottom on new activity
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "0px";
    const h = Math.min(textRef.current.scrollHeight, 200);
    textRef.current.style.height = h + "px";
  }, [input]);

  const remaining = useMemo(() => {
    if (isPro) return null;
    return FREE_CHAR_LIMIT - input.length;
  }, [input.length, isPro]);

  const lastAssistantIndex = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === "assistant") return i;
    return -1;
  }, [msgs]);

  function applyShortcut(kind) {
    const map = {
      followups:
        "Please ask concise follow-up questions for any missing details needed to write an MLS-ready listing.",
      shorter: "Rewrite the MLS section to be 20% shorter but keep all key facts.",
      social: "Create a 1–2 line social teaser with emojis and a call-to-action.",
      luxury: "Rewrite in a refined, luxury tone emphasizing lifestyle and finishes.",
    };
    setInput(map[kind]);
  }

  async function onSend(regen = false) {
    setErrorMsg(null);

    // Block when trial expired (server also enforces, this is UX guard)
    if (isExpired) {
      setErrorMsg("Your trial has ended. Upgrade to continue.");
      return;
    }

    const textToSend = regen
      ? findLastUserContent(msgs) || input.trim()
      : input.trim();

    if (!textToSend) return;

    // (Optional) keep char limit if you re-enable free gating somewhere
    if (!isPro && remaining !== null && remaining < 0) {
      setErrorMsg(`Free plan limit is ${FREE_CHAR_LIMIT} characters. Please shorten or upgrade.`);
      return;
    }

    // Add user message and a streaming assistant placeholder
    const newUserMsg = { role: "user", content: textToSend };
    const next = [...msgs, newUserMsg, { role: "assistant", content: "", parsed: null, streaming: true }];
    const assistantIdx = next.length - 1;

    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
        headers: { "Content-Type": "application/json" },
      });

      // If the server rejected due to trial status, show paywall friendly message
      if (!res.ok) {
        let errMsg = "Request failed";
        try {
          const j = await res.json();
          if (j?.error === "trial_expired") {
            errMsg = "Your trial has ended. Upgrade to continue.";
          } else {
            errMsg = j?.error || errMsg;
          }
        } catch {}
        throw new Error(errMsg);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE frames separated by \n\n
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;

          if (line.startsWith("data:")) {
            const jsonStr = line.slice(5).trim();
            if (jsonStr === "[DONE]") continue;

            // Try OpenRouter delta envelope
            try {
              const ev = JSON.parse(jsonStr);
              const delta = ev?.choices?.[0]?.delta?.content;
              if (typeof delta === "string") {
                acc += delta;
                livePatchAssistant(assistantIdx, acc);
              }
              continue;
            } catch {
              // might be "done"/"error" events; ignore here
            }
          }
        }
      }

      // Finalize assistant message, try to parse JSON
      let parsed = null;
      try { parsed = JSON.parse(acc); } catch {}
      completeAssistant(assistantIdx, acc, parsed);

      // Autosave structured listing
      if (AUTOSAVE && parsed?.type === "listing") {
        await saveListing(parsed, assistantIdx);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Something went wrong.");
      completeAssistant(assistantIdx, e?.message || "Sorry — I hit an error.", null);
    } finally {
      setLoading(false);
    }
  }

  function livePatchAssistant(idx, text) {
    setMsgs((m) => {
      const copy = m.slice();
      if (!copy[idx]) return m;
      copy[idx] = { ...copy[idx], content: text, parsed: null, streaming: true };
      return copy;
    });
  }

  function completeAssistant(idx, text, parsed) {
    setMsgs((m) => {
      const copy = m.slice();
      if (!copy[idx]) return m;
      copy[idx] = { role: "assistant", content: text, parsed: parsed || null, streaming: false };
      return copy;
    });
  }

  async function saveListing(payload, idx) {
    try {
      setSavingId(idx);
      const r = await fetch("/api/listings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) onSend();
    }
  }

  const startExamples = [
    "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
    "Downtown condo: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
    "Country property: 5 acres, 4-stall barn, seasonal creek, updated HVAC, fenced garden.",
  ];

  const hasAssistant = lastAssistantIndex !== -1;

  return (
    <>
      {/* Header with plan/trial badge */}
      <header className="chat-header" style={{ marginBottom: 18 }}>
        <div className="chat-logo">🏠</div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <div className="chat-title">ListGenie.ai Chat</div>
            <span className={`badge ${isPro ? "pro" : ""}`}>
              {isPro ? "Pro" : isTrial ? `Trial — ${daysLeft}d left` : "Trial ended"}
            </span>
          </div>
          <div className="chat-sub">Generate polished, MLS-ready listings plus social variants.</div>
        </div>
      </header>

      {/* Actions: Regenerate + Copy last */}
      {hasAssistant && (
        <div className="model-row" style={{ marginTop: 0, marginBottom: 12 }}>
          <button className="link" onClick={() => onSend(true)} disabled={loading || isExpired}>
            {loading ? "Generating…" : "Regenerate last"}
          </button>
          <button
            className="link"
            onClick={() => copyToClipboard(msgs[lastAssistantIndex].content)}
            style={{ marginLeft: 8 }}
            disabled={isExpired}
          >
            Copy last
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="msg-list">
        {msgs.map((m, i) => {
          const isUser = m.role === "user";

          // Structured cards (listing or questions)
          if (!isUser && m.parsed) {
            return (
              <div
                key={i}
                className="bubble assistant"
                style={{ padding: 0, border: "none", background: "transparent", boxShadow: "none" }}
              >
                {m.parsed.type === "listing" ? (
                  <ListingRender
                    data={m.parsed}
                    saving={savingId === i}
                    onSave={() => saveListing(m.parsed, i)}
                  />
                ) : (
                  <QuestionsRender data={m.parsed} />
                )}
              </div>
            );
          }

          // Default text bubble (markdown-lite for assistant)
          return (
            <div key={i} className={`bubble ${isUser ? "user" : "assistant"}`}>
              {isUser ? m.content : <MarkdownLite text={m.content} />}
            </div>
          );
        })}

        {msgs.length <= 1 && (
          <div className="card">
            <div className="chat-sub" style={{ marginBottom: 6 }}>Try one of these:</div>
            <div className="examples">
              {startExamples.map((ex, i) => (
                <button key={i} className="example-btn" onClick={() => setInput(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && <div className="error">{errorMsg}</div>}

        <div ref={endRef} />
      </div>

      {/* Paywall when trial expired */}
      {isExpired && (
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Your trial has ended.</div>
          <div className="chat-sub" style={{ marginBottom: 10 }}>
            Upgrade to Pro to continue generating listings.
          </div>
          <a href="/upgrade" className="btn">Upgrade to Pro</a>
        </div>
      )}

      {/* Composer + Shortcuts */}
      <div className="composer">
        <div className="composer-inner">
          <div className="input-row" style={{ alignItems: "stretch" }}>
            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isExpired ? "Upgrade to continue" : "Describe the property and any highlights…"}
              rows={1}
              className="textarea"
              disabled={isExpired}
            />
            <button
              onClick={() => onSend(false)}
              disabled={isExpired || loading || (!isPro && remaining !== null && remaining < 0)}
              className="btn"
            >
              {loading ? "Generating…" : "Send"}
            </button>
          </div>

          {/* Shortcuts */}
          <div className="examples" style={{ marginTop: 8 }}>
            <button className="example-btn" onClick={() => applyShortcut("followups")} disabled={isExpired}>Ask follow-ups</button>
            <button className="example-btn" onClick={() => applyShortcut("shorter")} disabled={isExpired}>Shorter MLS</button>
            <button className="example-btn" onClick={() => applyShortcut("social")} disabled={isExpired}>Social caption</button>
            <button className="example-btn" onClick={() => applyShortcut("luxury")} disabled={isExpired}>Luxury tone</button>
          </div>

          {/* (If you re-enable free caps later, this stays useful) */}
          {!isPro && !isExpired && (
            <div className="free-row">
              <div>
                {remaining !== null &&
                  (remaining >= 0
                    ? `${remaining} characters left on Free`
                    : `${Math.abs(remaining)} over the Free limit`)}
              </div>
              <a href={`${SITE_URL}/upgrade`} className="link">Unlock Pro</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- helpers ---------- */
function findLastUserContent(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].role === "user" && typeof list[i].content === "string") return list[i].content;
  }
  return "";
}
function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text); } catch {}
}

/* Minimal markdown-ish renderer: **bold**, bullets, newlines */
function MarkdownLite({ text }) {
  if (!text) return null;

  // Escape basic HTML
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Turn lines starting with -, •, or * into bullets
  const lines = safe.split(/\n+/);
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      blocks.push(`<ul style="margin:0 0 8px 18px">${list.join("")}</ul>`);
      list = [];
    }
  };

  for (const ln of lines) {
    const t = ln.trim();
    if (/^(\*|-|•)\s+/.test(t)) {
      list.push(`<li>${t.replace(/^(\*|-|•)\s+/, "")}</li>`);
    } else if (t) {
      flush();
      blocks.push(`<p style="margin:0 0 8px">${t}</p>`);
    }
  }
  flush();

  return <span dangerouslySetInnerHTML={{ __html: blocks.join("") }} />;
}