// pages/api/admin/grant-pro.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = req.headers['authorization'];
  if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const { clerk_id, email } = req.body;
    if (!clerk_id && !email) {
      return res.status(400).json({ ok: false, error: 'Provide either clerk_id or email' });
    }

    // If email provided, look up Clerk ID
    let finalClerkId = clerk_id;
    if (email) {
      const { data, error: lookupError } = await supabaseAdmin
        .from('users')
        .select('clerk_id')
        .eq('email', email)
        .single();

      if (lookupError || !data) {
        return res.status(404).json({ ok: false, error: 'User not found for that email' });
      }
      finalClerkId = data.clerk_id;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: 'pro' })
      .eq('clerk_id', finalClerkId);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, message: `User ${finalClerkId} upgraded to Pro.` });
  } catch (e) {
    console.error('grant-pro error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}