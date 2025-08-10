// pages/api/admin/index.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const q = (req.query.q || "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize || "20", 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base filter
    const base = supabaseAdmin
      .from("users")
      .select("id, clerk_id, email, name, role, plan, trial_end_date, created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    const filtered = q ? base.or(`email.ilike.%${q}%,name.ilike.%${q}%`) : base;

    // Count total
    const { count, error: countErr } = await filtered.range(0, 0);
    if (countErr) throw countErr;

    // Page of data
    const { data, error } = await filtered.range(from, to);
    if (error) throw error;

    return res.status(200).json({ ok: true, users: data || [], page, pageSize, total: count || 0 });
  } catch (err) {
    console.error("Admin index error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}