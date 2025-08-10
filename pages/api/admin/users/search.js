// pages/api/admin/users/search.js
import { isAdminRequest } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const q = (req.query.q || "").toString().trim();
    let query = supabaseAdmin
      .from("users")
      .select("id, clerk_id, email, name, role, plan, trial_end_date, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) {
      // simple ilike on email or name
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ ok: true, users: data || [] });
  } catch (e) {
    console.error("/api/admin/users/search", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}