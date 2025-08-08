// pages/api/admin/revoke-pro.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['authorization'];
  if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Ensure user exists
  const { data: user, error: fetchErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchErr || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Set role back to 'free'
  const { error: updateErr } = await supabaseAdmin
    .from('users')
    .update({ role: 'free' })
    .eq('email', email);

  if (updateErr) {
    return res.status(500).json({ error: updateErr.message });
  }

  return res.status(200).json({ message: `Reverted ${email} to free` });
}