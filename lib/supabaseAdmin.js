// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// NOTE: Don't throw at build time; Vercel injects envs at runtime for API routes.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _client = null;

/** Shared Supabase Admin client (service role) for API routes */
export const supabaseAdmin = (() => {
  if (!_client) {
    _client = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { 'X-Client-Info': 'listgenie-admin' } },
    });
  }
  return _client;
})();

