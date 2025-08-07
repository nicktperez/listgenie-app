// pages/api/user/init.js
import { getAuth } from '@clerk/nextjs/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  try {
    const { userId, sessionId } = getAuth(req);
    if (!userId || !sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Basic user info from Clerk (email/name)
    const { email, name } = await pullClerkBasics(userId);

    // Upsert by clerk_id
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        { clerk_id: userId, email, name },
        { onConflict: 'clerk_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ ok: true, role: data.role, user: data });
  } catch (err) {
    console.error('init user error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function pullClerkBasics(clerkId) {
  // We can avoid a Clerk API call by using headers from Clerk’s middleware in the future.
  // For now, try to read from req headers if present, or just return minimal info.
  // Replace later with Clerk Backend API if you want full fidelity.
  return { email: null, name: null };
}