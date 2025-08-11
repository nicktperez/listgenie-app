// pages/api/agent/save.js
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { name, email, phone, brokerage, logo_url } = req.body || {};

    const payload = {
      clerk_id: userId,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      brokerage: brokerage ?? null,
      logo_url: logo_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('agent_profiles')
      .upsert(payload, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ ok: true, profile: data });
  } catch (e) {
    console.error('[agent/save]', e);
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}