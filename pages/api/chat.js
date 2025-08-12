// pages/api/chat.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const FREE_CHAR_LIMIT = 1400;
const FREE_DAILY_LIMIT = 20;

// Schema note to the model:
// - If required info is missing, return { "type":"questions", "questions":[...] } ONLY.
// - Otherwise return { "type":"listing", ... } ONLY.
const SYSTEM_PROMPT = `
You are ListGenie, an expert real-estate copywriter.

ALWAYS return **ONLY JSON** with one of the two shapes below (no prose, no markdown):

1) When important info is missing, return:
{
  "type": "questions",
  "questions": [
    "Concise question 1?",
    "Concise question 2?"
  ],
  "missing": ["beds","baths","square_feet","neighborhood","upgrades","amenities"] // only include keys actually missing
}

2) When you have enough info to write a listing, return:
{
  "type": "listing",
  "headline": "Short captivating headline (max 10 words)",
  "mls": {
    "body": "One tight paragraph optimized for MLS (no fluff, no emojis).",
    "bullets": ["• key features, facts, upgrades, appliances, yard, parking, HOA, etc."]
  },
  "variants": [
    { "label": "Social Teaser", "text": "Short punchy post (1-2 lines, emojis ok)" },
    { "label": "Luxury Narrative", "text": "Elegant, lifestyle-focused paragraph" }
  ],
  "facts": { "beds":3, "baths":2, "sqft":1850, "lot_size":null, "year_built":null, "neighborhood":"", "parking":null, "hoa":null },
  "photo_shotlist": [
    "Front exterior at golden hour",
    "Kitchen wide with island",
    "Backyard/deck with seating"
  ],
  "disclaimer": "Equal Housing Opportunity."
}

CRITICAL RULES:
- Use only the information provided or logically implied. Never invent numbers.
- If square footage, beds, or baths are unknown, prefer QUESTIONS mode.
- Avoid filler. Tight, specific, benefit-driven language.
- NEVER ask for information that has already been provided, even if the answer was "N/A", "not sure", "unknown", or similar.
- If a user answered "N/A", "not sure", "unknown", "don't know", "unsure", etc., treat it as "information not available" and work with what you have.
- Make reasonable assumptions for missing details rather than asking again.
- Only ask questions for truly critical missing information that cannot be reasonably inferred.
- If you have enough information to create a compelling listing (even with some unknowns), generate the listing instead of asking more questions.
- **ABSOLUTELY NO REDUNDANT QUESTIONS**: If the user has already answered a question (even with "N/A"), NEVER ask it again.
- **PREFER LISTING GENERATION**: When in doubt, generate a listing with available information rather than asking more questions.
- **NEVER REPEAT QUESTIONS**: If the user has provided ANY information about a topic, consider that topic covered and move on.
- **GENERATE LISTINGS**: Your default behavior should be to generate listings, not ask questions.
- **HANDLE EDIT REQUESTS**: If the user asks to modify or add details to a listing, use the existing information and make the requested changes. Do not ask for information that was already provided.
- **CONTEXT AWARENESS**: Always consider the full conversation context when responding to follow-up requests.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    const { messages = [], temperature = 0.6, top_p = 1 } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ ok: false, error: "No messages provided" });

    // Plan + limits
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("clerk_id", userId)
      .maybeSingle();
    const plan = userRow?.plan || "free";
    const isPro = plan === "pro";

    const userText = lastUserText(messages) || "";
    if (!isPro && userText.length > FREE_CHAR_LIMIT) {
      return res.status(400).json({ ok: false, error: `Free plan limit is ${FREE_CHAR_LIMIT} characters.` });
    }

    if (!isPro) {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("chat_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sinceIso);
      if ((count || 0) >= FREE_DAILY_LIMIT) {
        return res.status(429).json({ ok: false, error: "Daily Free limit reached. Upgrade to Pro for more." });
      }
    }

    // Build domain-specific chat
    const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "openrouter/anthropic/claude-3.5";
    const orRes = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ListGenie.ai",
      },
      body: JSON.stringify({
        model,
        // Ask for JSON only; most OpenRouter models follow this instruction well
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature,
        top_p
      }),
    });

    if (!orRes.ok) {
      const err = await safeJson(orRes);
      const msg = err?.error?.message || err?.message || `OpenRouter error (${orRes.status})`;
      await log(userId, model, userText, `ERROR: ${msg}`);
      return res.status(orRes.status).json({ ok: false, error: msg });
    }

    const data = await orRes.json();
    const raw = data?.choices?.[0]?.message?.content || data?.message?.content || "";
    let parsed = null;

    // Parse JSON-only response; if it fails, treat as plain text
    try { parsed = JSON.parse(raw); } catch (_) {}

    // Log
    await log(userId, model, userText, raw, data?.usage);

    return res.status(200).json({
      ok: true,
      // send both raw + parsed; front-end will render smartly if parsed exists
      message: { role: "assistant", content: raw },
      parsed,
      plan
    });
  } catch (e) {
    console.error("api/chat fatal:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

/** helpers **/
function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string") return m.content;
  }
  return "";
}
async function safeJson(res) { try { return await res.json(); } catch { return null; } }
async function log(user_id, model, input, output, usage) {
  try {
    await supabaseAdmin.from("chat_logs").insert([{
      user_id, model, input, output,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
    }]);
  } catch (e) { console.error("chat_logs insert failed:", e?.message || e); }
}