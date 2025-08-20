// pages/api/agent/get.js
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { data, error } = await supabaseAdmin
      .from('agent_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ ok: true, profile: data || null });
  } catch (e) {
    console.error('[agent/get]', e);
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}