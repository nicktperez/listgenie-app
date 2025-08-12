// pages/api/user/plan.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
    
    const { userId } = getAuth(req);
    if (!userId) return res.status(200).json({ ok: true, plan: "expired" });

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("plan, trial_end_date, usage_count, last_usage, stripe_customer_id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) return res.status(200).json({ ok: true, plan: "expired" });

    // Normalize: if trial passed, reflect expired
    const now = new Date();
    const trialEnd = data?.trial_end_date ? new Date(data.trial_end_date) : null;
    let plan = data?.plan || "expired";
    if (plan === "trial" && trialEnd && now > trialEnd) plan = "expired";

    return res.status(200).json({
      ok: true,
      plan,
      trial_end_date: data?.trial_end_date || null,
      usage_count: data?.usage_count || 0,
      last_usage: data?.last_usage || null,
      stripe_customer_id: data?.stripe_customer_id || null
    });
  } catch (e) {
    console.error("User plan API error:", e);
    return res.status(200).json({ ok: true, plan: "expired" });
  }
}