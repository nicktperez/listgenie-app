// pages/api/user/generations.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }

    const { limit = 50, offset = 0 } = req.query;

    const { data: generations, error } = await supabaseAdmin
      .from("generations")
      .select("id, prompt, response, model, created_at")
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      // If table doesn't exist yet, return empty results instead of error
      if (error.code === '42P01') { // Table doesn't exist
        return res.status(200).json({
          ok: true,
          generations: [],
          total: 0
        });
      }
      console.error("Failed to fetch generations:", error);
      return res.status(500).json({ ok: false, error: "Failed to fetch generations" });
    }

    return res.status(200).json({
      ok: true,
      generations: generations || [],
      total: generations?.length || 0
    });

  } catch (e) {
    console.error("Generations API error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
