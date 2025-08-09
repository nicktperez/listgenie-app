// pages/api/user/init.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, sessionId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch Clerk user info via headers if you already pass it,
    // but usually easier: rely on what you stored previously.
    // We'll upsert minimally by clerk_id and keep email/name if you have them on first sign-in.
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      // not "no rows" error
      throw fetchErr;
    }

    // Upsert minimal row if missing
    let row = existing;
    if (!existing) {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("users")
        .insert([{ clerk_id: userId }])
        .select("*")
        .single();
      if (insErr) throw insErr;
      row = inserted;
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: row.id,
        clerk_id: row.clerk_id,
        role: row.role,       // 'admin' | 'free' (role is your old field; keep using)
        plan: row.plan || "free" // 'free' | 'pro'
      }
    });
  } catch (err) {
    console.error("user/init error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}