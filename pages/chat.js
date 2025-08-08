// pages/chat.js
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export default function Chat() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]); // [{role:'user'|'assistant', content:'...'}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model] = useState(DEFAULT_MODEL);
  const scrollerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, model }),
      });

      if (!res.ok || !res.body) {
        // Try to read the error body
        let err = "";
        try { err = await res.text(); } catch {}
        throw new Error(err || `HTTP ${res.status}`);
      }

      // Create a placeholder assistant message we’ll update as chunks arrive
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by \n\n; parse as complete events
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? ""; // keep incomplete piece

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;

          const data = line.slice(5).trim(); // after 'data:'
          if (data === "[DONE]") {
            buffer = "";
            break;
          }

          let json;
          try {
            json = JSON.parse(data);
          } catch {
            // not JSON we recognize; skip
            continue;
          }

          // Handle OpenAI-style or OpenRouter-style deltas
          let deltaText = "";

          // OpenAI-compatible
          if (json?.choices?.length) {
            deltaText = json.choices[0]?.delta?.content ?? "";
          }

          // OpenRouter event-style
          // Some variants: { event: 'message.delta', delta: { content: [{type:'text', text:'...'}] } }
          if (!deltaText && json?.delta?.content?.length) {
            for (const c of json.delta.content) {
              if (c?.type?.includes("text") && c?.text) deltaText += c.text;
            }
          }

          // Another variant: { message: { content: [{ type:'text', text:'...' }] } }
          if (!deltaText && json?.message?.content?.length) {
            for (const c of json.message.content) {
              if (c?.type?.includes("text") && c?.text) deltaText += c.text;
            }
          }

          if (!deltaText) continue;

          assistantContent += deltaText;
          // Update the last assistant message in place
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              last.content = assistantContent;
            }
            return copy;
          });
        }
      }
    } catch (err) {
      console.error("Streaming chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — I hit an error talking to the model. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-white/95">AI Chat Assistant</h1>
      <p className="text-white/60 mt-2">Ask questions or generate listings instantly.</p>

      <div
        ref={scrollerRef}
        className="mt-6 h-[56vh] rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 overflow-y-auto p-6"
      >
        {messages.length === 0 && (
          <div className="text-white/40 text-sm">Start a conversation…</div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                  m.role === "assistant"
                    ? "bg-white/5 text-white"
                    : "bg-sky-400/90 text-sky-950"
                }`}
              >
                <strong className="mr-1.5">{m.role === "assistant" ? "Genie:" : "You:"}</strong>
                <span>{m.content}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-3">
        <input
          className="flex-1 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message and press Enter…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="min-w-[84px] rounded-xl bg-sky-400 text-sky-950 font-semibold px-4 py-3 shadow-[0_8px_30px_rgba(56,189,248,0.35)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.45)] disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}