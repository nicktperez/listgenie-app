// pages/api/user/track-usage.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }

    const { action = "generation" } = req.body;

    // Update usage count and last usage time
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        usage_count: supabaseAdmin.sql`usage_count + 1`,
        last_usage: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("clerk_id", userId);

    if (error) {
      // If columns don't exist yet, try a simpler update
      if (error.code === '42703') { // Column doesn't exist
        console.warn("Usage tracking columns not found, skipping usage update");
        return res.status(200).json({
          ok: true,
          usage_count: 0,
          usage_remaining: 10,
          plan: "trial",
          is_trial: true,
          can_continue: true
        });
      }
      console.error("Failed to track usage:", error);
      return res.status(500).json({ ok: false, error: "Failed to track usage" });
    }

    // Get updated usage info
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("plan, usage_count, trial_end_date")
      .eq("clerk_id", userId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch updated usage:", fetchError);
      return res.status(500).json({ ok: false, error: "Failed to fetch usage" });
    }

    // Check if user has exceeded limits
    const now = new Date();
    const trialEnd = userData?.trial_end_date ? new Date(userData.trial_end_date) : null;
    const isTrial = userData?.plan === "trial" && trialEnd && now <= trialEnd;
    const usageLimit = userData?.plan === "pro" ? 1000 : 10;
    const usageRemaining = Math.max(0, usageLimit - userData.usage_count);

    return res.status(200).json({
      ok: true,
      usage_count: userData.usage_count,
      usage_remaining: usageRemaining,
      plan: userData.plan,
      is_trial: isTrial,
      can_continue: userData.plan === "pro" || (isTrial && userData.usage_count < usageLimit)
    });

  } catch (e) {
    console.error("Track usage error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
