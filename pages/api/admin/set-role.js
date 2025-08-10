// pages/api/admin/set-role.js
import { supabaseAdmin } from "@/utils/supabase-admin";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { userId, role } = req.body;
    if (!userId || !["admin", "user"].includes(role)) {
      return res.status(400).json({ ok: false, error: "Invalid role" });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", userId);

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Set role error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}