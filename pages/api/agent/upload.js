// pages/api/agent/upload.js
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function dataUrlToBuffer(dataUrl) {
  const [meta, b64] = (dataUrl || '').split(',');
  if (!meta || !b64) throw new Error('Invalid data URL');
  const ctMatch = /data:(.*?);base64/.exec(meta);
  const contentType = ctMatch ? ctMatch[1] : 'application/octet-stream';
  const buffer = Buffer.from(b64, 'base64');
  return { buffer, contentType };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { dataUrl, filename = 'logo.png', remember = false } = req.body || {};
    if (!dataUrl) return res.status(400).json({ ok: false, error: 'Missing dataUrl' });

    const { buffer, contentType } = dataUrlToBuffer(dataUrl);

    const ext = (contentType.split('/')[1] || 'png').toLowerCase();
    const safeName = filename.replace(/[^\w.\-]+/g, '_').replace(/\.\w+$/, '');
    const path = `logos/${userId}/${safeName}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabaseAdmin
      .storage
      .from('agent-assets')
      .upload(path, buffer, { contentType, upsert: true });

    if (upErr) throw upErr;

    const { data: pub } = supabaseAdmin
      .storage
      .from('agent-assets')
      .getPublicUrl(path);

    const publicUrl = pub?.publicUrl;
    if (!publicUrl) throw new Error('Could not get public URL');

    if (remember) {
      const payload = {
        clerk_id: userId,
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertErr } = await supabaseAdmin
        .from('agent_profiles')
        .upsert(payload, { onConflict: 'clerk_id' });
      if (upsertErr) throw upsertErr;
    }

    return res.status(200).json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error('[agent/upload]', e);
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}