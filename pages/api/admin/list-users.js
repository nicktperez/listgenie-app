// pages/api/admin/list-users.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = req.headers['authorization'];
  if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, users: data });
  } catch (e) {
    console.error('list-users error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}