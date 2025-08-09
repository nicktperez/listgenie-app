// pages/api/user/init.js
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || "14", 10);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    // Fetch Clerk user
    const u = await clerkClient.users.getUser(userId);
    const email =
      u?.primaryEmailAddress?.emailAddress ||
      u?.emailAddresses?.[0]?.emailAddress ||
      null;
    const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.username || null;

    // Check if this email has ever had a trial (to prevent multiple trials)
    let priorTrialExists = false;
    if (email) {
      const { data: prior } = await supabaseAdmin
        .from("users")
        .select("id, trial_end_date, plan")
        .eq("email", email)
        .limit(1);
      priorTrialExists = Array.isArray(prior) && prior.length > 0 && !!prior[0].trial_end_date;
    }

    // Upsert row for current clerk_id
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, plan, trial_end_date, email")
      .eq("clerk_id", userId)
      .maybeSingle();

    // Decide plan + trial_end_date
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    let nextPlan = "trial";
    let nextTrialEnd = trialEnd.toISOString();

    if (priorTrialExists) {
      // If same email had a trial before, mark as expired immediately
      nextPlan = "expired";
      nextTrialEnd = existing?.trial_end_date || now.toISOString();
    }

    if (!existing) {
      await supabaseAdmin.from("users").insert([{
        clerk_id: userId,
        email,
        name,
        plan: nextPlan,
        trial_end_date: nextTrialEnd,
      }]);
    } else {
      // Only set trial if user has no record of it yet; otherwise keep their current plan
      const update = { email, name };
      if (!existing.trial_end_date) {
        update.plan = nextPlan;
        update.trial_end_date = nextTrialEnd;
      }
      await supabaseAdmin.from("users").update(update).eq("clerk_id", userId);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("/api/user/init", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}