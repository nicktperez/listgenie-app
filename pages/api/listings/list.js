// pages/api/listings/list.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    const { data, error } = await supabaseAdmin
      .from("saved_listings")
      .select("id, title, payload, created_at")
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true, items: data || [] });
  } catch (e) {
    console.error("/api/listings/list fatal:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}