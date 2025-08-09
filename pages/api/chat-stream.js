// pages/api/chat-stream.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuth } from "@clerk/nextjs/server";

const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";
// Free plan limits (change anytime)
const FREE_LIMITS = {
  maxInputChars: 1400,         // ~350 tokens input
  maxOutputTokens: 350,        // assistant cap
  allowedModels: [DEFAULT_MODEL], // keep simple now
};

function getTextFromMessages(messages = []) {
  // Naive join for input-length estimation
  return messages.map(m => `${m.role}: ${typeof m.content === "string" ? m.content : ""}`).join("\n");
}

function estimateTokensFromChars(charCount) {
  // very rough: 4 chars ≈ 1 token
  return Math.ceil(charCount / 4);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId } = getAuth(req);
    const { messages = [], model = DEFAULT_MODEL } = req.body || {};
    if (!messages.length) return res.status(400).json({ error: "No messages" });

    // Fetch plan/role
    let plan = "free";
    let role = "free";
    if (userId) {
      const { data: userRow, error: userErr } = await supabaseAdmin
        .from("users")
        .select("plan, role")
        .eq("clerk_id", userId)
        .single();
      if (!userErr && userRow) {
        plan = userRow.plan || "free";
        role = userRow.role || "free";
      }
    }

    // Apply plan limits
    let maxOutputTokens = 800; // pro default
    let currentModel = model || DEFAULT_MODEL;

    if (plan === "free" && role !== "admin") {
      // gate model
      if (!FREE_LIMITS.allowedModels.includes(currentModel)) {
        currentModel = DEFAULT_MODEL;
      }

      const inputText = getTextFromMessages(messages);
      const chars = inputText.length;

      if (chars > FREE_LIMITS.maxInputChars) {
        return res.status(400).json({
          error: `Free plan limit: ${FREE_LIMITS.maxInputChars} chars input. You used ${chars}. Please shorten your prompt or upgrade.`,
          code: "INPUT_LIMIT",
        });
      }
      maxOutputTokens = FREE_LIMITS.maxOutputTokens;
    }

    // Call OpenRouter (streaming)
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });

    const controller = new AbortController();

    // Stream headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Kick the request
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://app.listgenie.ai",
        "X-Title": "ListGenie",
      },
      body: JSON.stringify({
        model: currentModel,
        stream: true,
        messages,
        max_tokens: maxOutputTokens,
      }),
      signal: controller.signal,
    });

    if (!orRes.ok) {
      const errTxt = await orRes.text().catch(() => "");
      res.write(`event: error\ndata: ${JSON.stringify({ error: errTxt || orRes.statusText })}\n\n`);
      return res.end();
    }

    // Pipe stream to client
    const reader = orRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Simple usage counters (approx)
    let promptTokens = estimateTokensFromChars(getTextFromMessages(messages).length);
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE format from OpenRouter is already `data: ...` lines, pass-through is fine.
      // For safety, split on newlines and forward.
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        // Count rough tokens for completion (very rough; could parse chunks for accuracy)
        if (line.startsWith("data: ")) {
          const payload = line.slice(6);
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content || "";
            if (typeof delta === "string") {
              completionTokens += estimateTokensFromChars(delta.length);
            }
          } catch {}
        }
        res.write(line + "\n");
      }
    }

    // Final newline to end SSE
    res.write("\n");
    res.end();

    // Fire and forget: log usage
    try {
      await supabaseAdmin.from("chat_logs").insert([{
        user_id: userId || null,
        model: currentModel,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        input: messages?.[messages.length - 2]?.content || null,
        output: null, // we didn't buffer full output; can capture separately if you want
      }]);
    } catch (e) {
      console.warn("usage log insert failed:", e?.message);
    }
  } catch (err) {
    console.error("chat-stream error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  }
}