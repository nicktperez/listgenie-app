// pages/api/admin/users/search.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const q = (req.query.q || "").toString().trim();
    let query = supabaseAdmin
      .from("users")
      .select("id, clerk_id, email, name, role, plan, trial_end_date, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (q) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ ok: true, users: data || [] });
  } catch (err) {
    console.error("admin/users/search error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}