// pages/api/listings/all.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("saved_listings")
      .select("id, title, payload, created_at")
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ ok: true, items: data || [] });
  } catch (e) {
    console.error("/api/listings/all", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}