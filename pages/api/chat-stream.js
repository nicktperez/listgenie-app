// pages/api/chat-stream.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const DEFAULT_MODEL =
  process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";

export const config = {
  api: {
    // We want to stream the response; default bodyParser is fine (we read JSON),
    // but keep the response open and don't compress the stream.
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).end("OPENROUTER_API_KEY is not configured");
  }

  try {
    const { userId } = getAuth(req);
    const { messages, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).end("messages is required (array)");
    }

    const usedModel = model || DEFAULT_MODEL;

    // Kick off upstream streaming request
    const upstream = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://listgenie.ai",
        "X-Title": "ListGenie",
      },
      body: JSON.stringify({
        model: usedModel,
        messages,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => "");
      throw new Error(`OpenRouter upstream error ${upstream.status}: ${txt}`);
    }

    // Prepare to stream SSE back to the browser
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // We'll accumulate the full text to log in Supabase when done
    let fullText = "";
    let promptTokens = null;
    let completionTokens = null;

    const decoder = new TextDecoder();
    const reader = upstream.body.getReader();
    let buffer = "";

    const flushEvent = (payload) => {
      // Forward raw SSE event to client
      res.write(`data: ${payload}\n\n`);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);

        // Each event may contain multiple "data:" lines; we only care about those
        const dataLines = rawEvent
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.replace(/^data:\s?/, ""));

        for (const dl of dataLines) {
          if (dl === "[DONE]") {
            flushEvent("[DONE]");
            // Try log usage once streaming ends
            try {
              await supabaseAdmin.from("chat_logs").insert({
                user_id: userId || null,
                model: usedModel,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                input: JSON.stringify(messages.slice(-1)[0] || messages[0]),
                output: fullText,
              });
            } catch (e) {
              console.warn("Supabase log insert (stream) failed:", e?.message || e);
            }
            res.end();
            return;
          }

          // Forward the raw line to the client (so the client can parse SSE if needed)
          flushEvent(dl);

          // Also parse to accumulate text locally for logging
          try {
            const json = JSON.parse(dl);

            // OpenAI-style deltas
            const delta = json?.choices?.[0]?.delta;
            if (delta?.content) {
              fullText += delta.content;
            }

            // Some providers send full message objects mid/at end
            const whole = json?.choices?.[0]?.message?.content;
            if (whole && typeof whole === "string") {
              fullText += whole;
            }

            // Capture usage if provided in-stream (not all providers do)
            if (json?.usage) {
              promptTokens = json.usage.prompt_tokens ?? promptTokens;
              completionTokens = json.usage.completion_tokens ?? completionTokens;
            }
          } catch {
            // non-JSON "data:" lines are okay to ignore (some keepalive events)
          }
        }
      }
    }

    // If we exited reader loop without [DONE], finalize anyway
    try {
      await supabaseAdmin.from("chat_logs").insert({
        user_id: userId || null,
        model: usedModel,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        input: JSON.stringify(messages.slice(-1)[0] || messages[0]),
        output: fullText,
      });
    } catch (e) {
      console.warn("Supabase log insert (no DONE) failed:", e?.message || e);
    }

    res.end();
  } catch (err) {
    console.error("chat-stream error:", err);
    // Send a friendly SSE error to client if headers already sent
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message || "Server error" })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}