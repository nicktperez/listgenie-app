// pages/api/stripe/create-portal-session.js
import { getAuth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthenticated" });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // read stripe_customer_id from Supabase
    const { data: userRow, error } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    const customer = userRow?.stripe_customer_id;
    if (!customer) {
      return res.status(400).json({ ok: false, error: "No Stripe customer found for this user." });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${siteUrl}/chat`,
    });

    return res.status(200).json({ ok: true, url: portal.url });
  } catch (e) {
    console.error("create-portal-session error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}