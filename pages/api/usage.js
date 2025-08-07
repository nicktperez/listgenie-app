// pages/api/usage.js
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // 1) Auth (Clerk)
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    // 2) Pull role + basic profile from Supabase users table
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('role, email, name')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (userErr) {
      // Not fatal—fall back to free role if lookup fails
      console.error('Supabase users lookup error:', userErr);
    }

    const role = userRow?.role || 'free';
    const isAdmin = role === 'admin';

    // 3) Query usage
    // Admins can request all rows by adding ?all=1; otherwise scope to current user
    const fetchAll = isAdmin && (req.query.all === '1' || req.query.all === 'true');

    let q = supabaseAdmin
      .from('chat_logs')
      .select('id,user_id,model,prompt_tokens,completion_tokens,input,output,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!fetchAll) {
      q = q.eq('user_id', userId);
    }

    const { data: rows, error: logsErr } = await q;
    if (logsErr) {
      console.error('Supabase chat_logs error:', logsErr);
      return res.status(500).json({ ok: false, error: 'Failed to fetch usage logs' });
    }

    // 4) Aggregate totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.requests += 1;
        acc.tokens_in += Number(r.prompt_tokens || 0);
        acc.tokens_out += Number(r.completion_tokens || 0);
        if (r.model) {
          acc.by_model[r.model] = acc.by_model[r.model] || { requests: 0, tokens_in: 0, tokens_out: 0 };
          acc.by_model[r.model].requests += 1;
          acc.by_model[r.model].tokens_in += Number(r.prompt_tokens || 0);
          acc.by_model[r.model].tokens_out += Number(r.completion_tokens || 0);
        }
        return acc;
      },
      { requests: 0, tokens_in: 0, tokens_out: 0, by_model: {} }
    );

    // 5) Shape response for the UI
    return res.status(200).json({
      ok: true,
      user: {
        id: userId,
        email: userRow?.email || null,
        name: userRow?.name || null,
      },
      role,
      rows,
      totals,
      scope: fetchAll ? 'all' : 'self',
    });
  } catch (err) {
    console.error('Unexpected /api/usage error:', err);
    return res.status(500).json({ ok: false, error: 'Unexpected server error' });
  }
}