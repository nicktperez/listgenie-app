// pages/api/chat.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      // You’re already gating the page with <SignedIn />, but keep this for API safety.
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }

    const {
      messages = [],
      model: clientModel,
      temperature = 0.7,
      top_p = 1,
    } = req.body || {};

    const model =
      clientModel ||
      process.env.NEXT_PUBLIC_DEFAULT_MODEL ||
      "openrouter/anthropic/claude-3.5";

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: "No messages provided" });
    }

    // Call OpenRouter (non-stream)
    const orRes = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // These two headers are recommended by OpenRouter for safety/analytics
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ListGenie.ai",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p,
      }),
    });

    if (!orRes.ok) {
      const err = await safeJson(orRes);
      const msg =
        err?.error?.message ||
        err?.message ||
        `OpenRouter request failed (${orRes.status})`;
      // Log failure with minimal info
      await safeInsertLog({
        user_id: userId,
        model,
        input: lastUserText(messages),
        output: `ERROR: ${msg}`,
      });
      return res.status(orRes.status).json({ ok: false, error: msg });
    }

    const data = await orRes.json();

    // Try to normalize the reply + usage
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.message?.content ||
      data?.output ||
      "";

    const usage = data?.usage || null; // { prompt_tokens, completion_tokens, total_tokens } if provider returns it

    // Insert chat log
    await safeInsertLog({
      user_id: userId,
      model,
      input: lastUserText(messages),
      output: reply,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
    });

    return res.status(200).json({
      ok: true,
      message: { role: "assistant", content: reply },
      usage: usage || undefined,
    });
  } catch (e) {
    console.error("api/chat error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/** Helpers **/

function lastUserText(messages) {
  // Grab the most recent user message text (for logging convenience)
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string") return m.content;
  }
  return typeof messages?.[messages.length - 1]?.content === "string"
    ? messages[messages.length - 1].content
    : null;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function safeInsertLog({
  user_id,
  model,
  input,
  output,
  prompt_tokens = null,
  completion_tokens = null,
}) {
  try {
    await supabaseAdmin.from("chat_logs").insert([
      {
        user_id, // clerk_id (nullable allowed in your schema)
        model,
        prompt_tokens,
        completion_tokens,
        input,
        output,
      },
    ]);
  } catch (e) {
    // Do not throw; logging failures shouldn't break chat
    console.error("chat_logs insert failed:", e?.message || e);
  }
}