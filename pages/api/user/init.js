// pages/api/user/init.js
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    // Pull fresh data from Clerk
    const cUser = await clerkClient.users.getUser(userId);
    const email =
      cUser?.primaryEmailAddress?.emailAddress ||
      cUser?.emailAddresses?.[0]?.emailAddress ||
      null;
    const name = [cUser?.firstName, cUser?.lastName].filter(Boolean).join(" ") || cUser?.username || null;

    // Upsert by clerk_id; default plan is 'free'
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        { clerk_id: userId, email, name, role: "free", plan: "free" },
        { onConflict: "clerk_id" }
      )
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, user: data });
  } catch (e) {
    console.error("user/init error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}