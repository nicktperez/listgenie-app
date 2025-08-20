import { getAuth } from "@clerk/nextjs/server";

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
    const { address, bedrooms, bathrooms, sqft, style, features } = req.body || {};
    if (!address || !bedrooms || !bathrooms || !sqft || !style) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }
    return res.status(200).json({
      ok: true,
      listing: `This beautiful ${style} home at ${address} offers ${bedrooms} bedrooms and ${bathrooms} bathrooms across ${sqft} sqft. ${features}`,
      email: `Hi there! I wanted to share a stunning ${style} property at ${address} featuring ${bedrooms} beds and ${bathrooms} baths. Let me know if you'd like a tour!`,
      social: `🏡 New Listing Alert! ${bedrooms} Bed / ${bathrooms} Bath ${style} home at ${address}. ${features} #RealEstate #NewListing`,
    });
  } catch (e) {
    console.error("generate API error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
