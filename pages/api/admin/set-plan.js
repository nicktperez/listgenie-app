// pages/api/admin/set-plan.js
import { supabaseAdmin } from "@/utils/supabase-admin";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const { userId, plan } = req.body;
    if (!userId || !["trial", "pro", "expired"].includes(plan)) {
      return res.status(400).json({ ok: false, error: "Invalid plan" });
    }

    let trial_end_date = null;
    if (plan === "trial") {
      trial_end_date = dayjs().add(14, "day").toISOString(); // 14-day trial
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ plan, trial_end_date })
      .eq("id", userId);

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Set plan error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}