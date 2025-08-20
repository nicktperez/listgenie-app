// /pages/api/openrouter/models.js
// Fetches model list from OpenRouter API and returns it.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function getOrigin(req) {
  const envURL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (envURL) {
    return envURL.startsWith('http') ? envURL : `https://${envURL}`;
  }
  const host = req?.headers?.host;
  return host ? `https://${host}` : 'http://localhost:3000';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': getOrigin(req),
    'X-Title': 'ListGenie',
  };

  let apiResponse;
  try {
    apiResponse = await fetch('https://openrouter.ai/api/v1/models', { headers });
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

  return res.status(200).json(data);
}
