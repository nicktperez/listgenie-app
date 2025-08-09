// pages/chat.js
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

const FREE_MAX_INPUT_CHARS = 1400;

export default function Chat() {
  const { isSignedIn } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [plan, setPlan] = useState("free"); // 'free' | 'pro'
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/user/init");
        const j = await r.json();
        if (j?.user?.plan) setPlan(j.user.plan);
      } catch (_) {}
    })();
  }, []);

  async function sendMessage(e) {
    e?.preventDefault?.();
    setErr("");

    if (!input.trim()) return;

    if (plan === "free" && input.length > FREE_MAX_INPUT_CHARS) {
      setErr(`Free plan limit: ${FREE_MAX_INPUT_CHARS} characters. Please shorten your prompt or upgrade.`);
      return;
    }

    const newMsgs = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMsgs);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          model: undefined, // stick with server default; or pass a selected one
        }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text();
        setErr(msg || "Model error");
        setSending(false);
        return;
      }

      // Stream in
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Append assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // The server forwards SSE lines; we only need the text deltas
        // If you're forwarding raw "data: {json}" lines, parse them;
        // here we simply collect any non-event text (depends on your server format).
        acc += chunk;
        // naive parse: pull out "delta.content" text
        // If your server is pass-through SSE, consider a proper SSE parser later.
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            last.content = (last.content || "") + chunk.replace(/^data:\s*/gm, "");
          }
          return copy;
        });
      }
    } catch (e) {
      setErr("Connection error.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container chat-page">
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
        <h1 className="headline" style={{marginBottom:0}}>AI Chat Assistant</h1>
        <span
          title={plan === "free" ? "Free plan limits apply" : "Pro plan"}
          style={{
            padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: plan === "free" ? "rgba(255,255,255,.08)" : "linear-gradient(90deg,#4f9dfc,#66e0ff)",
            color: plan === "free" ? "#cfe0ff" : "#0b1020",
            border: "1px solid rgba(255,255,255,.14)"
          }}
        >
          {plan.toUpperCase()}
        </span>
      </div>

      <p className="subhead">Ask questions or generate listings instantly.</p>

      <div className="card chat-box" style={{minHeight: 360}}>
        {messages.length === 0 ? (
          <div className="empty-chat">Start a conversation…</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === "user" ? "user" : "ai"}`}>
              {m.content}
            </div>
          ))
        )}
      </div>

      {err && (
        <div style={{marginTop:10, color:"#ff9f9f"}}>{err}</div>
      )}

      <form onSubmit={sendMessage} className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Type your message and press Enter…"
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={plan === "free" ? FREE_MAX_INPUT_CHARS + 200 : undefined}
        />
        <button className="btn btn-primary" disabled={sending}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      {plan === "free" && (
        <div style={{marginTop:6, fontSize:12, color:"var(--text-dim)"}}>
          Free plan: ~{FREE_MAX_INPUT_CHARS} characters per prompt & limited output length.
        </div>
      )}
    </main>
  );
}