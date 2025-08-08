// pages/api/chat-stream.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    let body;
    try {
      body = req.body ?? JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  
    // 1) Choose a valid default, and allow env override
    const DEFAULT_MODEL =
      process.env.NEXT_PUBLIC_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";
  
    // 2) Accept client model, but sanitize "openrouter/" prefix if someone sends it
    let requestedModel = (body?.model || DEFAULT_MODEL).trim();
    if (requestedModel.startsWith("openrouter/")) {
      requestedModel = requestedModel.replace(/^openrouter\//, "");
    }
  
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const max_tokens = Number(body?.max_tokens) || 800;
    const temperature = Number(body?.temperature) || 0.7;
  
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY env on server.",
        hint:
          "Add OPENROUTER_API_KEY in Vercel > Project > Settings > Environment Variables and redeploy.",
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
          "HTTP-Referer": site,
          "X-Title": "ListGenie.ai",
        },
        body: JSON.stringify({
          model: requestedModel,
          messages,
          max_tokens,
          temperature,
        }),
      });
  
      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(r.status || 502).json({
          error: "Upstream returned non-JSON.",
          status: r.status,
          body: text?.slice(0, 1500),
        });
      }
  
      if (!r.ok || data.error) {
        return res.status(r.status || 400).json({
          error: data?.error?.message || "OpenRouter error",
          status: r.status,
          details: data,
          model_used: requestedModel,
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
  
      return res.status(200).json({ message: content, model: requestedModel });
    } catch (err) {
      return res.status(500).json({
        error: "Server error calling OpenRouter.",
        details: String(err?.message || err),
      });
    }
  }