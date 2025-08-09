// pages/chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ProWall } from "@/components/ProGate";

const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_DEFAULT_MODEL || "openrouter/anthropic/claude-3.5";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

const FREE_CHAR_LIMIT = 1400; // adjust as needed

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-28">
      <header className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
          🏠
        </div>
        <div>
          <h1 className="text-xl font-semibold">ListGenie.ai Chat</h1>
          <p className="text-sm opacity-70">
            Generate polished real estate listings with AI.
          </p>
        </div>
      </header>

      <SignedOut>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="mb-3 text-sm opacity-80">
            Please sign in to start generating listings.
          </p>
          <SignInButton mode="modal">
            <button className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
              Sign in with Clerk
            </button>
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

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Tell me about the property (beds, baths, sqft, neighborhood, upgrades, nearby amenities) and I’ll draft a compelling listing. You can also paste bullet points.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [model, setModel] = useState(DEFAULT_MODEL);

  const endRef = useRef(null);
  const textRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "0px";
    const h = Math.min(textRef.current.scrollHeight, 180);
    textRef.current.style.height = h + "px";
  }, [input]);

  const remaining = useMemo(() => {
    if (isPro) return null;
    const left = FREE_CHAR_LIMIT - input.length;
    return left;
  }, [input.length, isPro]);

  const onSend = async () => {
    setErrorMsg(null);
    if (!input.trim()) return;

    if (!isPro && input.length > FREE_CHAR_LIMIT) {
      setErrorMsg(
        `Free plan limit is ${FREE_CHAR_LIMIT} characters. Please shorten your prompt or upgrade to Pro.`
      );
      return;
    }

    const newUserMsg = { role: "user", content: input.trim() };
    const next = [...messages, newUserMsg];

    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          model,
          // optional: pass clerk id for logging on server if you use it
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

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message || "Something went wrong.");
      // rollback last user message on hard failure? keeping it is nicer for editing
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) onSend();
    }
  };

  const startExamples = [
    "3 bed, 2 bath, 1,850 sqft home in Fair Oaks with remodeled kitchen, quartz counters, and a large backyard near parks.",
    "Downtown condo listing: 1 bed loft, floor-to-ceiling windows, balcony with skyline view, walkable to coffee shops.",
    "Country property: 5 acres, 4 stall barn, seasonal creek, updated HVAC, and fenced garden.",
  ];

  return (
    <>
      {/* Message list */}
      <div className="mb-4 space-y-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}

        {messages.length <= 1 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-sm opacity-70">Try one of these:</div>
            <div className="flex flex-wrap gap-2">
              {startExamples.map((ex, i) => (
                <button
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                  onClick={() => setInput(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <TypingBubble />}

        {errorMsg && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm">
            {errorMsg}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Model selector (Pro unlock extra models example) */}
      <div className="mb-3 flex items-center gap-2 text-xs opacity-70">
        <span>Model:</span>
        <select
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>
          <ProWall
            fallback={<option disabled>gpt-4.1 (Pro)</option>}
          >
            <option value="openrouter/openai/gpt-4.1">openrouter/openai/gpt-4.1</option>
          </ProWall>
          <ProWall
            fallback={<option disabled>o4-mini (Pro)</option>}
          >
            <option value="openrouter/openai/o4-mini">openrouter/openai/o4-mini</option>
          </ProWall>
        </select>

        <span className="ml-auto">
          <Badge plan={plan} />
        </span>
      </div>

      {/* Composer (docked) */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#0e1116]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe the property and any highlights…"
              rows={1}
              className="min-h-[44px] max-h-[180px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:opacity-60"
            />
            <button
              onClick={onSend}
              disabled={loading || (!isPro && input.length > FREE_CHAR_LIMIT)}
              className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Send"}
            </button>
          </div>

          {!isPro && (
            <div className="mt-2 flex items-center justify-between text-xs opacity-70">
              <div>
                {remaining !== null && (
                  <span>
                    {remaining >= 0
                      ? `${remaining} characters left on Free`
                      : `${Math.abs(remaining)} over the Free limit`}
                  </span>
                )}
              </div>
              <a
                href={`${SITE_URL}/upgrade`}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
              >
                Unlock Pro
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white/15 border border-white/10"
            : "bg-white/5 border border-white/10"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <span className="inline-flex gap-1">
          <Dot /> <Dot /> <Dot />
        </span>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span className="inline-block h-2 w-2 animate-bounce rounded-full opacity-70 [animation-delay:var(--d,0ms)]" />
  );
}

function Badge({ plan }) {
  const isPro = plan === "pro";
  return (
    <span
      className={`rounded-md px-2 py-1 ${
        isPro
          ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
          : "bg-white/10 text-white/80 border border-white/15"
      }`}
    >
      {isPro ? "Pro" : "Free"}
    </span>
  );
}