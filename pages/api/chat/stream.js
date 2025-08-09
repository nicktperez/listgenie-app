// pages/api/chat/stream.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: false } };

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `...same as before...`; // keep your JSON-only system prompt

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }

  try {
    const raw = await readAll(req);
    const body = JSON.parse(raw.toString("utf-8") || "{}");

    const { userId } = getAuth(req);
    if (!userId) return endErr(res, 401, "Unauthenticated");

    const { messages = [], temperature = 0.6, top_p = 1 } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return endErr(res, 400, "No messages provided");
    }

    // Load plan + trial
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from("users")
      .select("plan, trial_end_date")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (uErr) return endErr(res, 500, uErr.message);

    const now = new Date();
    const trialEnd = userRow?.trial_end_date ? new Date(userRow.trial_end_date) : null;
    const isPro = userRow?.plan === "pro";
    const isTrialActive = userRow?.plan === "trial" && trialEnd && now <= trialEnd;

    if (!isPro && !isTrialActive) {
      return endErr(res, 402, "trial_expired");
    }

    // stream setup
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "openrouter/anthropic/claude-3.5";
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
      res.write(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
      return res.end();
    }

    const reader = or.body.getReader();
    let finalText = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value).toString("utf-8");
      res.write(chunk);

      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (json === "[DONE]") continue;
        try {
          const evt = JSON.parse(json);
          const delta = evt?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") finalText += delta;
        } catch {}
      }
    }

    res.write(`event: done\ndata: {"ok":true}\n\n`);
    res.end();

    // optional: log finalText as before (omitted for brevity)
  } catch (e) {
    console.error("stream fatal:", e);
    try {
      res.write(`event: error\ndata: {"error":"Server error"}\n\n`);
      res.end();
    } catch {}
  }
}

async function readAll(req) { const chunks=[]; for await (const c of req) chunks.push(c); return Buffer.concat(chunks); }
async function safeJson(res) { try { return await res.json(); } catch { return null; } }
function endErr(res, code, msg){ res.statusCode=code; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ok:false,error:msg})); }