// pages/api/admin/billing-portal.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    // Fetch user row
    const { data: u, error: uErr } = await supabaseAdmin
      .from("users")
      .select("id, email, name, clerk_id, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!u) return res.status(404).json({ ok: false, error: "User not found" });

    // Ensure Stripe Customer exists
    let customerId = u.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: u.email || undefined,
        name: u.name || undefined,
        metadata: { clerk_id: u.clerk_id || "" },
      });
      customerId = customer.id;
      const { error: updErr } = await supabaseAdmin
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", u.id);
      if (updErr) throw updErr;
    }

    const returnUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.listgenie.ai";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${returnUrl  }/admin`,
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    console.error("/api/admin/billing-portal", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}