// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const FREE_CHAR_LIMIT = 1400;

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
  const { user } = useUser();
  const { plan, isPro } = useUserPlan();

  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      content:
        "Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing. You can also paste bullet points.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const endRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "0px";
    const h = Math.min(textRef.current.scrollHeight, 180);
    textRef.current.style.height = h + "px";
  }, [input]);

  const remaining = useMemo(() => {
    if (isPro) return null;
    return FREE_CHAR_LIMIT - input.length;
  }, [input.length, isPro]);

  async function onSend() {
    setErrorMsg(null);
    if (!input.trim()) return;

    if (!isPro && input.length > FREE_CHAR_LIMIT) {
      setErrorMsg(
        `Free plan limit is ${FREE_CHAR_LIMIT} characters. Please shorten your prompt or upgrade to Pro.`
      );
      return;
    }

    const newUserMsg = { role: "user", content: input.trim() };
    const next = [...msgs, newUserMsg];

    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          clerkId: user?.id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Request failed");
      }

      const data = await res.json();
      const reply =
        data?.message?.content ||
        data?.choices?.[0]?.message?.content ||
        data?.output ||
        "Sorry — I could not generate a reply.";

      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
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
    "Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
    "Country property: 5 acres, 4 stall barn, seasonal creek, updated HVAC, and fenced garden.",
  ];

  return (
    <>
      {/* Chat header */}
      <header className="chat-header" style={{ marginBottom: 18 }}>
        <div className="chat-logo">🏠</div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div className="chat-title">ListGenie.ai Chat</div>
            <span className={`badge ${plan === "pro" ? "pro" : ""}`}>
              {plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>
          <div className="chat-sub">
            Generate polished real estate listings with AI.
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="msg-list">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`bubble ${m.role === "user" ? "user" : "assistant"}`}
          >
            {m.content}
          </div>
        ))}

        {msgs.length <= 1 && (
          <div className="card">
            <div className="chat-sub" style={{ marginBottom: 6 }}>
              Try one of these:
            </div>
            <div className="examples">
              {startExamples.map((ex, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setInput(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="bubble assistant">Typing…</div>}

        {errorMsg && <div className="error">{errorMsg}</div>}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="composer">
        <div className="composer-inner">
          <div className="input-row">
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
              onClick={onSend}
              disabled={loading || (!isPro && input.length > FREE_CHAR_LIMIT)}
              className="btn"
            >
              {loading ? "Generating…" : "Send"}
            </button>
          </div>

          {!isPro && (
            <div className="free-row">
              <div>
                {remaining !== null &&
                  (remaining >= 0
                    ? `${remaining} characters left on Free`
                    : `${Math.abs(remaining)} over the Free limit`)}
              </div>
              <a href="/upgrade" className="link">Unlock Pro</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}