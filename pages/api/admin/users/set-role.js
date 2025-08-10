// pages/api/admin/users/set-role.js
import { isAdminRequest } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROLES = new Set(["admin", "pro", "free"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { clerk_id, role } = req.body || {};
    if (!clerk_id || !ROLES.has(role)) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    const { error } = await supabaseAdmin.from("users").update({ role }).eq("clerk_id", clerk_id);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("/api/admin/users/set-role", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}