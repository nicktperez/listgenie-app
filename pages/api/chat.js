// pages/api/chat.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const DEFAULT_MODEL =
  process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const { userId } = getAuth(req);
    const { messages, model } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const usedModel = model || DEFAULT_MODEL;

    // Call OpenRouter (non-streaming)
    const orRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "https://listgenie.ai",
        "X-Title": "ListGenie",
      },
      body: JSON.stringify({
        model: usedModel,
        messages,
        // no stream flag here (non-streaming)
      }),
    });

    if (!orRes.ok) {
      const text = await orRes.text().catch(() => "");
      return res
        .status(orRes.status)
        .json({ error: `OpenRouter error: ${text || orRes.statusText}` });
    }

    const data = await orRes.json();

    // Try to extract the assistant text (OpenAI-compatible shape)
    const message =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    // Grab usage if provided
    const prompt_tokens = data?.usage?.prompt_tokens ?? null;
    const completion_tokens = data?.usage?.completion_tokens ?? null;

    // Fire-and-forget log to Supabase
    try {
      await supabaseAdmin.from("chat_logs").insert({
        user_id: userId || null,
        model: usedModel,
        prompt_tokens,
        completion_tokens,
        input: JSON.stringify(messages.slice(-1)[0] || messages[0]),
        output: message,
      });
    } catch (e) {
      // Don’t kill the response if logging fails
      console.warn("Supabase log insert failed:", e?.message || e);
    }

    return res.status(200).json({
      message,
      model: usedModel,
      usage: { prompt_tokens, completion_tokens },
      raw: data, // useful for debugging; remove later if you want
    });
  } catch (err) {
    console.error("api/chat error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}