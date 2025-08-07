// pages/api/admin/grant-pro.js
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Simple gate: use an admin token from env
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { clerkId, email } = req.body || {};
  if (!clerkId && !email) {
    return res.status(400).json({ error: 'Provide clerkId or email' });
  }

  const match = clerkId ? { clerk_id: clerkId } : { email };

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role: 'pro' })
    .match(match)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({ ok: true, user: data });
}