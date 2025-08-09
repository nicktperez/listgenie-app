// pages/api/chat.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Server-side limits
const FREE_CHAR_LIMIT = 1400;
const FREE_DAILY_LIMIT = 20; // requests per rolling 24h for Free

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    const {
      messages = [],
      model: clientModel,
      temperature = 0.7,
      top_p = 1
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: "No messages provided" });
    }

    // --- Fetch plan from Supabase ---
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (uErr) return res.status(500).json({ ok: false, error: uErr.message });

    const plan = userRow?.plan || "free";
    const isPro = plan === "pro";

    // --- Server-side Free limits ---
    const userText = lastUserText(messages) || "";
    if (!isPro && userText.length > FREE_CHAR_LIMIT) {
      return res.status(400).json({
        ok: false,
        error: `Free plan limit is ${FREE_CHAR_LIMIT} characters. Please shorten your prompt or upgrade to Pro.`
      });
    }

    // Count user requests in the last 24 hours
    if (!isPro) {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: cErr } = await supabaseAdmin
        .from("chat_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sinceIso);

      if (cErr) return res.status(500).json({ ok: false, error: cErr.message });

      if ((count || 0) >= FREE_DAILY_LIMIT) {
        return res.status(429).json({
          ok: false,
          error: `Daily limit reached on Free. Come back later or upgrade to Pro for higher limits.`
        });
      }
    }

    // Choose model (you removed selector from UI; keep a sane default)
    const model =
      clientModel ||
      process.env.NEXT_PUBLIC_DEFAULT_MODEL ||
      "openrouter/anthropic/claude-3.5";

    // --- Call OpenRouter (non-stream) ---
    const orRes = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ListGenie.ai",
      },
      body: JSON.stringify({ model, messages, temperature, top_p })
    });

    if (!orRes.ok) {
      const err = await safeJson(orRes);
      const msg =
        err?.error?.message ||
        err?.message ||
        `OpenRouter request failed (${orRes.status})`;
      await safeInsertLog({ user_id: userId, model, input: userText, output: `ERROR: ${msg}` });
      return res.status(orRes.status).json({ ok: false, error: msg });
    }

    const data = await orRes.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.message?.content ||
      data?.output ||
      "";

    const usage = data?.usage || null;

    await safeInsertLog({
      user_id: userId,
      model,
      input: userText,
      output: reply,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
    });

    return res.status(200).json({
      ok: true,
      message: { role: "assistant", content: reply },
      usage: usage || undefined,
      plan
    });
  } catch (e) {
    console.error("api/chat error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/** helpers **/
function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string") return m.content;
  }
  return typeof messages?.[messages.length - 1]?.content === "string"
    ? messages[messages.length - 1].content
    : "";
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
        user_id, // clerk_id
        model,
        prompt_tokens,
        completion_tokens,
        input,
        output,
      },
    ]);
  } catch (e) {
    console.error("chat_logs insert failed:", e?.message || e);
  }
}