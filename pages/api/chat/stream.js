// pages/api/chat/stream.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: false } };

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `You are ListGenie, an expert real estate listing assistant. Your job is to create compelling, professional property descriptions that help realtors sell properties faster.

IMPORTANT: Always respond with structured content in this exact format:

# MLS-Ready
[Professional MLS listing with proper real estate terminology, square footage, features, and selling points]

# Social Caption
[Engaging social media caption with emojis, hashtags, and call-to-action]

# Luxury Tone
[Premium, sophisticated description emphasizing luxury features, lifestyle, and exclusivity]

# Concise Version
[Short, punchy description perfect for quick posts and ads]

Guidelines:
- Use specific details about the property
- Include relevant real estate terms
- Make each format appropriate for its platform
- Keep social media engaging and shareable
- Use luxury language for high-end properties
- Make concise versions impactful in few words
- Always include the 4 sections above
- Be creative but professional
- Focus on benefits and lifestyle, not just features

Example input: "3 bed, 2 bath ranch in suburbs, updated kitchen, large yard"
Example output: [4 formatted sections as described above]`;

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

    const { messages = [], temperature = 0.7, top_p = 1 } = body || {};
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

    const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "openrouter/anthropic/claude-3.5-sonnet";
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
        max_tokens: 2000,
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

    // Log the generation for analytics
    try {
      await supabaseAdmin
        .from("generations")
        .insert({
          clerk_id: userId,
          prompt: messages[messages.length - 1]?.content || "",
          response: finalText,
          model: model,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      console.error("Failed to log generation:", e);
    }

  } catch (e) {
    console.error("stream fatal:", e);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Server error" })}\n\n`);
    res.end();
  }
}

// Helper functions
async function readAll(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function endErr(res, status, message) {
  res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
  res.end();
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}