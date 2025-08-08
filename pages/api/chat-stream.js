// pages/api/chat-stream.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    // Basic body guard
    let body;
    try {
      body = req.body ?? JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  
    const {
      messages = [],
      model = "openrouter/anthropic/claude-3.5-sonnet",
      max_tokens = 800,
      temperature = 0.7,
    } = body || {};
  
    // Env checks (these are the most common causes)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY env on server.",
        hint: "Add OPENROUTER_API_KEY in Vercel > Project > Settings > Environment Variables and redeploy.",
      });
    }
  
    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.origin ||
      "https://app.listgenie.ai";
  
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          // App attribution headers: not access control, but good hygiene
          "HTTP-Referer": site, // full URL
          "X-Title": "ListGenie.ai",
        },
        body: JSON.stringify({
          model,
          messages,        // [{ role: "user"|"assistant"|"system", content: "..." }, ...]
          max_tokens,
          temperature,
          // stream: false (default) - keep it simple for now
        }),
      });
  
      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Sometimes upstream returns HTML or plaintext on errors
        return res.status(r.status || 502).json({
          error: "Upstream returned non-JSON.",
          status: r.status,
          body: text?.slice(0, 1500),
        });
      }
  
      // OpenRouter error shape
      if (!r.ok || data.error) {
        return res.status(r.status || 400).json({
          error: data?.error?.message || "OpenRouter error",
          status: r.status,
          details: data,
        });
      }
  
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.delta?.content ??
        "";
  
      if (!content) {
        return res.status(502).json({
          error: "No content returned from model.",
          details: data,
        });
      }
  
      return res.status(200).json({ message: content });
    } catch (err) {
      // Network/unknown
      return res.status(500).json({
        error: "Server error calling OpenRouter.",
        details: String(err?.message || err),
      });
    }
  }