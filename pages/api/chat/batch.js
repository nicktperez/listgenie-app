// pages/api/chat/batch.js
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

    // Check if user is Pro
    const { data: userRow, error: uErr } = await supabaseAdmin
      .from("users")
      .select("plan")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (uErr || !userRow) {
      return res.status(500).json({ ok: false, error: "Failed to verify user" });
    }

    if (userRow.plan !== "pro") {
      return res.status(403).json({ ok: false, error: "Pro plan required for batch processing" });
    }

    const {
      address,
      bedrooms,
      bathrooms,
      sqft,
      style,
      features,
      // Remove unused tone variable
    } = req.body;

    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ ok: false, error: "No properties provided" });
    }

    if (properties.length > 20) {
      return res.status(400).json({ ok: false, error: "Maximum 20 properties per batch" });
    }

    // Process each property
    const results = [];
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const SYSTEM_PROMPT = `You are ListGenie, an expert real estate listing assistant. Create a compelling property description for the given property details.

Format your response as:
# MLS-Ready
[Professional MLS listing]

# Social Caption  
[Engaging social media post]

# Luxury Tone
[Premium description]

# Concise Version
[Short, impactful description]

Be specific, professional, and engaging.`;

    for (const property of properties) {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "ListGenie.ai",
          },
          body: JSON.stringify({
            model: "openrouter/anthropic/claude-3.5-sonnet",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Generate a listing for: ${property.description || property.address || "this property"}` }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          
          results.push({
            property: property.description || property.address || `Property ${results.length + 1}`,
            content,
            success: true
          });
        } else {
          results.push({
            property: property.description || property.address || `Property ${results.length + 1}`,
            content: "Failed to generate listing",
            success: false
          });
        }
      } catch (e) {
        results.push({
          property: property.description || property.address || `Property ${results.length + 1}`,
          content: "Error generating listing",
          success: false
        });
      }
    }

    // Track batch usage
    await supabaseAdmin
      .from("users")
      .update({
        usage_count: supabaseAdmin.sql`usage_count + ${properties.length}`,
        last_usage: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("clerk_id", userId);

    return res.status(200).json({
      ok: true,
      results,
      total_processed: properties.length,
      successful: results.filter(r => r.success).length
    });

  } catch (e) {
    console.error("Batch processing error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
