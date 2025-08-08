// pages/api/chat-stream.js
export const config = {
  api: {
    bodyParser: true,
  },
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_PUBLIC;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const { messages = [], model = "anthropic/claude-3.5-sonnet" } = req.body || {};

    // Start a streaming request to OpenRouter (OpenAI-compatible endpoint)
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // These two headers help OpenRouter attribute requests to your app
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://listgenie.ai",
        "X-Title": "ListGenie",
      },
      body: JSON.stringify({
        model,
        stream: true,
        // Temperature etc: keep simple/cheap
        temperature: 0.7,
        messages,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return res
        .status(upstream.status || 500)
        .json({ error: "Upstream error", status: upstream.status, details: text });
    }

    // Prepare to forward SSE back to the browser
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body.getReader();
    const encoder = new TextEncoder();

    // Forward chunks 1:1 (don’t parse here — let the client handle SSE parsing)
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        res.write(value);
      }
    }

    // Important: send final SSE terminator just in case
    res.write(encoder.encode("data: [DONE]\n\n"));
    res.end();
  } catch (err) {
    console.error("chat-stream error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Server error", details: String(err?.message || err) });
    }
    res.end();
  }
}