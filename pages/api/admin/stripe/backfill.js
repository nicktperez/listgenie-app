// pages/api/admin/stripe/backfill.js
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
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ ok: false, error: "STRIPE_SECRET_KEY missing" });
  }

  // Safety: don’t accidentally run prod with test expectations
  const isTestKey = process.env.STRIPE_SECRET_KEY.includes("_test_");

  try {
    // Pull a manageable batch to avoid long requests. Adjust if needed.
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, clerk_id, stripe_customer_id")
      .is("stripe_customer_id", null)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    let created = 0;
    const failures = [];

    for (const u of users || []) {
      try {
        const customer = await stripe.customers.create({
          email: u.email || undefined,
          name: u.name || undefined,
          metadata: { clerk_id: u.clerk_id || "", env: isTestKey ? "test" : "live" },
        });
        const { error: updErr } = await supabaseAdmin
          .from("users")
          .update({ stripe_customer_id: customer.id })
          .eq("id", u.id);
        if (updErr) throw updErr;
        created++;
      } catch (e) {
        failures.push({ id: u.id, email: u.email || null, error: e.message });
      }
    }

    return res.status(200).json({
      ok: true,
      created,
      checked: users?.length || 0,
      failures,
      mode: isTestKey ? "test" : "live",
    });
  } catch (e) {
    console.error("/api/admin/stripe/backfill", e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}