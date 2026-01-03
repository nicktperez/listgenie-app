// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL env var");
}
if (!SUPABASE_SERVICE_ROLE) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY env var");
}

// Provide dummy values for build time to prevent crash
export const supabaseAdmin = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE || 'placeholder-key',
  {
    auth: { persistSession: false },
  });