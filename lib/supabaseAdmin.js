// /lib/supabaseAdmin.js
// Server‑only Supabase client using the Service Role key.
// Do NOT import this from the browser.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!serviceRole) {
  throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false },
});