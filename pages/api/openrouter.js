// /pages/api/openrouter.js
// Proxies chat requests to OpenRouter and logs the exchange to Supabase.

import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Best-effort site metadata for OpenRouter headers
function getOrigin(req) {
  const envURL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (envURL) {
    // ensure fully-qualified URL
    return envURL.startsWith('http') ? envURL : `https://${envURL}`;
  }
  const host = req?.headers?.host;
  return host ? `https://${host}` : 'http://localhost:3000';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  const { userId } = getAuth(req);
  let body;

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const {
    messages,
    model = 'anthropic/claude-3.5-sonnet',
    temperature = 0.3,
    max_tokens = 800,
    // you can pass any other OpenAI-compatible params if you want
  } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Body must include messages: Message[]' });
  }

  // Build headers required by OpenRouter (helpful for rate limits/analytics)
  const origin = getOrigin(req);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': origin,
    'X-Title': 'ListGenie',
  };

  let apiResponse;
  try {
    apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });
  } catch (e) {
    console.error('OpenRouter fetch error:', e);
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }

  if (!apiResponse.ok) {
    const text = await apiResponse.text().catch(() => '');
    console.error('OpenRouter non-OK:', apiResponse.status, text);
    return res.status(apiResponse.status).json({ error: text || 'OpenRouter error' });
  }

  let data;
  try {
    data = await apiResponse.json();
  } catch (e) {
    console.error('OpenRouter JSON parse error:', e);
    return res.status(502).json({ error: 'Invalid JSON from OpenRouter' });
  }

  // OpenAI-compatible shape:
  // { choices: [ { message: { role, content } } ], usage: { prompt, completion, total } }
  const assistantText =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ?? // some providers
    '';

  // Token usage object can vary by model/provider; normalize as best we can
  const usage = data?.usage ?? {
    prompt: data?.prompt_tokens ?? null,
    completion: data?.completion_tokens ?? null,
    total: data?.total_tokens ?? null,
  };

  // Log to Supabase (non-blocking failure)
  try {
    await supabaseAdmin.from('chat_logs').insert({
      user_id: userId ?? null,
      model,
      prompt_tokens: usage?.prompt ?? null,
      completion_tokens: usage?.completion ?? null,
      input: JSON.stringify(messages),
      output: assistantText,
    });
  } catch (e) {
    console.error('Failed to log chat to Supabase:', e?.message || e);
    // don’t fail the request for logging problems
  }

  return res.status(200).json({
    message: assistantText,
    usage,
    model,
  });
}