// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ListingRender, QuestionsRender } from "@/components/ListingRender";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const FREE_CHAR_LIMIT = 1400;
const AUTOSAVE = true; // set false if you only want manual "Save Listing"

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
  const { plan, isPro } = useUserPlan();

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

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

    const textToSend = regen
      ? // regenerate: reuse the last user message (or combine last user + last AI questions)
        findLastUserContent(msgs) || input.trim()
      : input.trim();

    if (!textToSend) return;

    if (!isPro && textToSend.length > FREE_CHAR_LIMIT) {
      setErrorMsg(`Free plan limit is ${FREE_CHAR_LIMIT} characters. Please shorten or upgrade.`);
      return;
    }

    // Add user message (for regen, still append so history is preserved)
    const newUserMsg = { role: "user", content: textToSend };
    const next = [...msgs, newUserMsg, { role: "assistant", content: "", parsed: null, streaming: true }];
    const assistantIdx = next.length - 1;

    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok || !res.body) {
        let msg = "Request failed";
        try {
          const json = await res.json();
          msg = json?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = ""; // accumulate assistant text

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Parse SSE lines as they arrive
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
              // Might be our custom events (done/error)
            }
          }
          if (line.startsWith("event:")) {
            // optional: handle custom events
          }
        }
      }

      // Finalize message
      let parsed = null;
      try { parsed = JSON.parse(acc); } catch {}
      completeAssistant(assistantIdx, acc, parsed);

      // Autosave listing
      if (AUTOSAVE && parsed?.type === "listing") {
        await saveListing(parsed, assistantIdx);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Something went wrong.");
      // Turn the streaming placeholder into an error bubble
      completeAssistant(assistantIdx, "Sorry — I hit an error.", null);
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
      {/* Header with plan badge */}
      <header className="chat-header" style={{ marginBottom: 18 }}>
        <div className="chat-logo">🏠</div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <div className="chat-title">ListGenie.ai Chat</div>
            <span className={`badge ${plan === "pro" ? "pro" : ""}`}>{plan === "pro" ? "Pro" : "Free"}</span>
          </div>
          <div className="chat-sub">Generate polished, MLS-ready listings plus social variants.</div>
        </div>
      </header>

      {/* Action row: Regenerate + Copy last */}
      {hasAssistant && (
        <div className="model-row" style={{ marginTop: 0, marginBottom: 12 }}>
          <button className="link" onClick={() => onSend(true)} disabled={loading}>
            {loading ? "Generating…" : "Regenerate last"}
          </button>
          <button
            className="link"
            onClick={() => copyToClipboard(msgs[lastAssistantIndex].content)}
            style={{ marginLeft: 8 }}
          >
            Copy last
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="msg-list">
        {msgs.map((m, i) => {
          const isUser = m.role === "user";

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

          return (
            <div key={i} className={`bubble ${isUser ? "user" : "assistant"}`}>
              {isUser ? (
                m.content
              ) : (
                <MarkdownLite text={m.content} />
              )}
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

      {/* Composer + Shortcuts */}
      <div className="composer">
        <div className="composer-inner">
          <div className="input-row" style={{ alignItems: "stretch" }}>
            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe the property and any highlights…"
              rows={1}
              className="textarea"
            />
            <button
              onClick={() => onSend(false)}
              disabled={loading || (!isPro && input.length > FREE_CHAR_LIMIT)}
              className="btn"
            >
              {loading ? "Generating…" : "Send"}
            </button>
          </div>

          {/* Shortcuts */}
          <div className="examples" style={{ marginTop: 8 }}>
            <button className="example-btn" onClick={() => applyShortcut("followups")}>Ask follow-ups</button>
            <button className="example-btn" onClick={() => applyShortcut("shorter")}>Shorter MLS</button>
            <button className="example-btn" onClick={() => applyShortcut("social")}>Social caption</button>
            <button className="example-btn" onClick={() => applyShortcut("luxury")}>Luxury tone</button>
          </div>

          {!isPro && (
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