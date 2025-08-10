// pages/api/listings/delete.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    const { error } = await supabaseAdmin
      .from("saved_listings")
      .delete()
      .eq("id", id)
      .eq("clerk_id", userId); // ensure user owns it

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("/api/listings/delete", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}