// pages/api/user/init.js
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthenticated' });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      null;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, plan, trial_end_date')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ ok: false, error: 'Database error' });
    }

    if (existingUser) {
      // User exists, return current plan info
      return res.status(200).json({
        ok: true,
        plan: existingUser.plan,
        trial_end_date: existingUser.trial_end_date,
        message: 'User already initialized',
      });
    }

    // Create new user with trial plan
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        plan: 'trial',
        trial_end_date: trialEndDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res
        .status(500)
        .json({ ok: false, error: 'Failed to create user' });
    }

    return res.status(200).json({
      ok: true,
      plan: newUser.plan,
      trial_end_date: newUser.trial_end_date,
      message: 'User initialized successfully',
    });
  } catch (e) {
    console.error('User init error:', e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
