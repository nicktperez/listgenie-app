// pages/api/chat/stream.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = {
  api: {
    bodyParser: false, // we'll read the raw stream body
  },
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Limits mirrored from non-stream route
const FREE_CHAR_LIMIT = 1400;
const FREE_DAILY_LIMIT = 20;

// Same system prompt as your structured endpoint
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
  "missing": ["beds","baths","square_feet","neighborhood","upgrades","amenities"]
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
  "facts": { "beds":null, "baths":null, "sqft":null, "lot_size":null, "year_built":null, "neighborhood":"", "parking":null, "hoa":null },
  "photo_shotlist": [
    "Front exterior at golden hour",
    "Kitchen wide with island",
    "Backyard/deck with seating"
  ],
  "disclaimer": "Equal Housing Opportunity."
}

Rules:
- Use only info provided or logically implied. Never invent numbers.
- If sqft/beds/baths unknown, prefer QUESTIONS mode.
- Be tight, specific, benefit-driven.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }

  try {
    // Read JSON body manually (since bodyParser is off)
    const raw = await readAll(req);
    const body = JSON.parse(raw.toString("utf-8") || "{}");

    const { userId } = getAuth(req);
    if (!userId) return endJson(res, 401, { ok: false, error: "Unauthenticated" });

    const { messages = [], temperature = 0.6, top_p = 1 } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return endJson(res, 400, { ok: false, error: "No messages provided" });
    }

    // Plan & limits
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (uErr) return endJson(res, 500, { ok: false, error: uErr.message });

    const plan = userRow?.plan || "free";
    const isPro = plan === "pro";

    const userText = lastUserText(messages) || "";
    if (!isPro && userText.length > FREE_CHAR_LIMIT) {
      return endJson(res, 400, { ok: false, error: `Free plan limit is ${FREE_CHAR_LIMIT} characters.` });
    }

    if (!isPro) {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: cErr } = await supabaseAdmin
        .from("chat_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sinceIso);
      if (cErr) return endJson(res, 500, { ok: false, error: cErr.message });
      if ((count || 0) >= FREE_DAILY_LIMIT) {
        return endJson(res, 429, { ok: false, error: "Daily Free limit reached. Upgrade to Pro for more." });
      }
    }

    const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "openrouter/anthropic/claude-3.5";

    // Prepare response for streaming (SSE pass-through)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // Call OpenRouter with streaming on
    const or = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ListGenie.ai",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature,
        top_p,
      }),
    });

    if (!or.ok || !or.body) {
      const errBody = await safeJson(or);
      const msg = errBody?.error?.message || errBody?.message || `OpenRouter error (${or.status})`;
      await log(userId, model, userText, `ERROR: ${msg}`);
      res.write(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
      return res.end();
    }

    // Stream proxy + accumulate final text to log & client parse
    const reader = or.body.getReader();
    let finalText = "";
    let usage = null;

    // Proxy the SSE as-is to client, while also collecting text chunks
    // OpenRouter uses data: {choices:[{delta:{content:"..."}}]}
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value).toString("utf-8");

      // Forward chunk to client
      res.write(chunk);

      // Accumulate any content deltas for final parse/log
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (json === "[DONE]") continue;
        try {
          const evt = JSON.parse(json);
          const delta = evt?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") finalText += delta;
          if (evt?.usage && !usage) usage = evt.usage;
        } catch {
          // ignore partial/incomplete lines
        }
      }
    }

    // Finish stream
    res.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    res.end();

    // Log after finishing
    await log(userId, model, userText, finalText, usage);
  } catch (e) {
    console.error("stream fatal:", e);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "Server error" })}\n\n`);
      res.end();
    } catch {}
  }
}

/** helpers **/
async function readAll(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function safeJson(res) { try { return await res.json(); } catch { return null; } }
function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string") return m.content;
  }
  return "";
}
async function log(user_id, model, input, output, usage) {
  try {
    await supabaseAdmin.from("chat_logs").insert([{
      user_id, model, input, output,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
    }]);
  } catch (e) { console.error("chat_logs insert failed:", e?.message || e); }
}