// pages/api/chat-stream.js

export const config = {
  api: {
    bodyParser: true,
  },
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const SITE_URL = process.env.SITE_URL || "https://listgenie.ai";
const APP_URL = process.env.APP_URL || "https://app.listgenie.ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const { messages = [], model: clientModel, userId: bodyUserId } = req.body || {};
    const model = clientModel || "anthropic/claude-3.5-sonnet";

    const payload = {
      model,
      stream: true,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    const upstream = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": "ListGenie",
        "X-App-Name": "ListGenie",
        "X-User-Id": "public",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return res
        .status(upstream.status || 500)
        .json({ error: text || "OpenRouter upstream error" });
    }

    // Prepare to stream back to client
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    let fullText = "";
    const decoder = new TextDecoder();

    for await (const chunk of upstream.body) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();

        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);

          const deltaContent =
            (json && json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) ||
            (json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) ||
            json?.message?.content ||
            json?.delta ||
            json?.content ||
            "";

          if (deltaContent) {
            fullText += deltaContent;
            res.write(deltaContent);
          }
        } catch {
          // ignore keepalives or non-JSON lines
        }
      }
    }

    // Optional Supabase logging (no-op if not configured)
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const headerUserIdRaw = req.headers["x-user-id"];
        const headerUserId =
          Array.isArray(headerUserIdRaw) ? headerUserIdRaw[0] : headerUserIdRaw || null;
        const userId = bodyUserId || headerUserId || null;

        await supabase.from("chat_logs").insert({
          user_id: userId,
          model,
          prompt_tokens: null,
          completion_tokens: null,
          input: messages[messages.length - 1]?.content || "",
          output: fullText,
        });
      }
    } catch (e) {
      console.warn("Supabase log failed:", e && e.message ? e.message : e);
    }

    res.end();
  } catch (err) {
    console.error("chat-stream error:", err);
    if (res.headersSent) {
      try { res.end(); } catch {}
      return;
    }
    return res.status(500).json({ error: "Unexpected error in chat-stream endpoint" });
  }
}