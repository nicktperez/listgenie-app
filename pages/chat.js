// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ProWall } from "@/components/ProGate";

// …keep the rest of the logic exactly as you have it…

export default function ChatPage() {
  return (
    <div className="chat-wrap">
      <header className="chat-header">
        <div className="chat-logo">🏠</div>
        <div>
          <div className="chat-title">ListGenie.ai Chat</div>
          <div className="chat-sub">
            Generate polished real estate listings with AI.
          </div>
        </div>
      </header>

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
  // …state + effects unchanged…

  return (
    <>
      {/* Messages */}
      <div className="msg-list">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === "user" ? "user" : "assistant"}`}>
            {m.content}
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="card">
            <div className="chat-sub" style={{ marginBottom: 6 }}>
              Try one of these:
            </div>
            <div className="examples">
              {startExamples.map((ex, i) => (
                <button key={i} className="example-btn" onClick={() => setInput(ex)}>
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

      {/* Model + plan row */}
      <div className="model-row">
        <span>Model:</span>
        <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
          <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>
          <ProWall fallback={<option disabled>gpt-4.1 (Pro)</option>}>
            <option value="openrouter/openai/gpt-4.1">openrouter/openai/gpt-4.1</option>
          </ProWall>
          <ProWall fallback={<option disabled>o4-mini (Pro)</option>}>
            <option value="openrouter/openai/o4-mini">openrouter/openai/o4-mini</option>
          </ProWall>
        </select>

        <span className={`badge ${plan === "pro" ? "pro" : ""}`}>
          {plan === "pro" ? "Pro" : "Free"}
        </span>
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
              <a href={`${SITE_URL}/upgrade`} className="link">
                Unlock Pro
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}