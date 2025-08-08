// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' });
    }

    // Use a safe default; you can change this anytime
    const modelId = model || 'anthropic/claude-3.5-sonnet';

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        // These two are recommended by OpenRouter to identify your app
        'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://app.listgenie.ai',
        'X-Title': 'ListGenie',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(resp.status).json({
        error: 'Upstream error',
        upstream: text || resp.statusText,
      });
    }

    const data = await resp.json();

    // Be defensive: some SDKs return content as a string, some as an array
    let assistant = '';
    const choice = data?.choices?.[0]?.message;
    if (typeof choice?.content === 'string') {
      assistant = choice.content;
    } else if (Array.isArray(choice?.content)) {
      assistant = choice.content
        .map((part) => (typeof part === 'string' ? part : part?.text || ''))
        .join('');
    } else {
      assistant = data?.choices?.[0]?.text || '';
    }

    return res.status(200).json({
      message: assistant || '(empty response)',
      usage: data?.usage || null,
      raw: process.env.NODE_ENV === 'development' ? data : undefined,
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}