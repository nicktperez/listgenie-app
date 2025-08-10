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
    if (!userId) {
      return res.status(401).json({ ok: false, error: "no_userId_from_clerk" });
    }

    // Clerk user basics
    const u = await clerkClient.users.getUser(userId);
    const email =
      u?.primaryEmailAddress?.emailAddress ||
      u?.emailAddresses?.[0]?.emailAddress ||
      null;
    const name =
      [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
      u?.username ||
      null;

    // Existing row for this Clerk ID?
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("users")
      .select("id, plan, trial_end_date, email")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (readErr) {
      return res.status(500).json({ ok: false, error: "supabase_read_failed", detail: readErr.message });
    }

    // Has this email had a trial before (to block repeat trials)?
    let priorTrialExists = false;
    if (email) {
      const { data: prior, error: priorErr } = await supabaseAdmin
        .from("users")
        .select("id, trial_end_date")
        .eq("email", email)
        .limit(1);
      if (priorErr) {
        return res.status(500).json({ ok: false, error: "supabase_prior_check_failed", detail: priorErr.message });
      }
      priorTrialExists = Array.isArray(prior) && prior.length > 0 && !!prior[0].trial_end_date;
    }

    const now = new Date();
    const trialEndIso = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    if (!existing) {
      const row = {
        clerk_id: userId,
        email,
        name,
        plan: priorTrialExists ? "expired" : "trial",
        trial_end_date: priorTrialExists ? now.toISOString() : trialEndIso,
      };
      const { error: insErr } = await supabaseAdmin.from("users").insert([row]);
      if (insErr) {
        return res.status(500).json({ ok: false, error: "supabase_insert_failed", detail: insErr.message });
      }
      return res.status(200).json({ ok: true, created: true, plan: row.plan, trial_end_date: row.trial_end_date });
    }

    // Update name/email, and if no trial_end_date set yet, assign one
    const update = { email, name };
    if (!existing.trial_end_date) {
      if (priorTrialExists) {
        update.plan = "expired";
        update.trial_end_date = now.toISOString();
      } else {
        update.plan = "trial";
        update.trial_end_date = trialEndIso;
      }
    }
    const { error: updErr } = await supabaseAdmin.from("users").update(update).eq("clerk_id", userId);
    if (updErr) {
      return res.status(500).json({ ok: false, error: "supabase_update_failed", detail: updErr.message });
    }

    return res.status(200).json({ ok: true, created: false, plan: update.plan ?? existing.plan, trial_end_date: update.trial_end_date ?? existing.trial_end_date });
  } catch (e) {
    console.error("/api/user/init fatal:", e);
    return res.status(500).json({ ok: false, error: "server_error", detail: e?.message });
  }
}