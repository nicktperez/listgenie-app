// pages/api/admin/set-plan.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED = new Set(["trial", "pro", "expired"]);
const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || "14", 10);

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId, plan } = req.body || {};
    if (!userId || !ALLOWED.has(plan)) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    let update = { plan, trial_end_date: null };
    if (plan === "trial") {
      update.trial_end_date = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: updErr } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("id", userId);
    if (updErr) throw updErr;

    const { data: user, error: selErr } = await supabaseAdmin
      .from("users")
      .select("id, clerk_id, email, name, role, plan, trial_end_date, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (selErr) throw selErr;

    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error("Set plan error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}