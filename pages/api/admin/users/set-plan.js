// pages/api/admin/users/set-plan.js
import { isAdminRequest } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED = new Set(["pro", "trial", "expired", "free"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { clerk_id, plan, trial_end_date } = req.body || {};
    if (!clerk_id || !ALLOWED.has(plan)) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    const update = { plan };
    if (plan === "trial" && trial_end_date) update.trial_end_date = trial_end_date;
    if (plan !== "trial") update.trial_end_date = null;

    const { error } = await supabaseAdmin.from("users").update(update).eq("clerk_id", clerk_id);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("/api/admin/users/set-plan", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}