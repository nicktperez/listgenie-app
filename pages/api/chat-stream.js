// pages/api/chat-stream.js
export const config = {
    runtime: "edge",
  };
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_BASE_URL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const DEFAULT_MODEL =
    process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";
  const PUBLIC_SITE =
    process.env.NEXT_PUBLIC_SITE_URL || "https://app.listgenie.ai";
  
  export default async function handler(req) {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }
  
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  
    const { messages, model } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  
    const usedModel = model || DEFAULT_MODEL;
  
    // Prefer explicit env; fall back to request origin/referer
    const reqOrigin = req.headers.get("origin") || req.headers.get("referer") || PUBLIC_SITE;
    const refererHeader = PUBLIC_SITE || reqOrigin;
  
    const upstream = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        // These two headers are how OpenRouter verifies your app
        "HTTP-Referer": refererHeader,
        "X-Title": "ListGenie",
      },
      body: JSON.stringify({
        model: usedModel,
        stream: true,
        messages,
      }),
    });
  
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      const status = upstream.status;
  
      let friendly =
        "The model request failed. Please try again.";
      if (status === 401 || status === 403) {
        friendly =
          "OpenRouter rejected the request (likely domain whitelist). Make sure your app domain is allowed in OpenRouter (e.g., https://app.listgenie.ai) and that NEXT_PUBLIC_SITE_URL matches.";
      }
  
      return new Response(
        JSON.stringify({
          error: friendly,
          status,
          detail: text || upstream.statusText,
        }),
        { status, headers: { "content-type": "application/json" } }
      );
    }
  
    // Stream back to the client
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  }