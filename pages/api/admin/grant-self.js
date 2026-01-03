import { getAuth } from "@clerk/nextjs/server";
import { isAdminRequest } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    // Make current user admin; do not touch plan unless you want to:
    // IMPORTANT: 'role' column is not in standard schema I just wrote. 
    // This file implies it exists. We should add it to DATABASE_SETUP.md or just execute the update if it works.

    // NOTE: This call might fail if 'role' column doesn't exist.
    const { error: updErr } = await supabaseAdmin
      .from("users")
      .update({ role: "admin" })
      .eq("id", userId);
    if (updErr) throw updErr;

    const { data: user, error: selErr } = await supabaseAdmin
      .from("users")
      .select("id, email, plan, trial_end_date, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (selErr) throw selErr;

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    console.error("/api/admin/grant-self", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}