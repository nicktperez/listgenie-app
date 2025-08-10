// pages/api/admin/grant-self.js
import { getAuth, clerkClient } from "@clerk/nextjs/server";
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

    const me = await clerkClient.users.getUser(userId);
    const email =
      me?.primaryEmailAddress?.emailAddress ||
      me?.emailAddresses?.[0]?.emailAddress ||
      null;

    const { error } = await supabaseAdmin
      .from("users")
      .update({ role: "admin" })
      .eq("clerk_id", userId);

    if (error) throw error;
    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error("/api/admin/grant-self", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}