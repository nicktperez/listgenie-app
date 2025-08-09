// pages/api/debug/env.js
export default function handler(req, res) {
    const ok = (k) => Boolean(process.env[k] && process.env[k].length > 5);
    res.status(200).json({
      NEXT_PUBLIC_SUPABASE_URL: ok('NEXT_PUBLIC_SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: ok('SUPABASE_SERVICE_ROLE_KEY'),
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ok('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
      CLERK_SECRET_KEY: ok('CLERK_SECRET_KEY'),
      OPENROUTER_API_KEY: ok('OPENROUTER_API_KEY'),
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
      node_env: process.env.NODE_ENV,
    });
  }