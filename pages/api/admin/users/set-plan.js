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
    if (plan === "trial") {
      update.trial_end_date =
        trial_end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      update.trial_end_date = null;
    }

    const { error: updErr } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("clerk_id", clerk_id);
    if (updErr) throw updErr;

    const { data: user, error: selErr } = await supabaseAdmin
      .from("users")
      .select("id, clerk_id, email, name, role, plan, trial_end_date, created_at")
      .eq("clerk_id", clerk_id)
      .maybeSingle();
    if (selErr) throw selErr;

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    console.error("/api/admin/users/set-plan", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}