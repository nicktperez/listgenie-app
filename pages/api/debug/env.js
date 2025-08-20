// pages/api/debug/env.js
import { getAuth } from "@clerk/nextjs/server";

export default function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }
    const ok = (k) => Boolean(process.env[k] && process.env[k].length > 5);
    return res.status(200).json({
      ok: true,
      NEXT_PUBLIC_SUPABASE_URL: ok("NEXT_PUBLIC_SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: ok("SUPABASE_SERVICE_ROLE_KEY"),
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ok("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
      CLERK_SECRET_KEY: ok("CLERK_SECRET_KEY"),
      OPENROUTER_API_KEY: ok("OPENROUTER_API_KEY"),
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
      node_env: process.env.NODE_ENV,
    });
  } catch (e) {
    console.error("debug env error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
