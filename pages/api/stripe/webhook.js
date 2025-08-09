import Stripe from "stripe";
import { buffer } from "micro";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verify failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clerkId =
          session?.metadata?.clerk_id ||
          session?.subscription?.metadata?.clerk_id ||
          null;

        if (clerkId) {
          await setPlan(clerkId, "pro");
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;
        const clerkId =
          session?.metadata?.clerk_id ||
          session?.subscription?.metadata?.clerk_id ||
          null;
      
        const customerId = session?.customer || null;
      
        if (clerkId) {
          // store customer id + set plan=pro
          const { error } = await supabaseAdmin
            .from("users")
            .update({ plan: "pro", stripe_customer_id: customerId })
            .eq("clerk_id", clerkId);
      
          if (error) console.error("Supabase update error:", error.message);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const clerkId = sub?.metadata?.clerk_id || null;
        if (clerkId) {
          await setPlan(clerkId, "free");
        }
        break;
      }

      default:
        // ignore other events
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return res.status(500).send("Webhook handler failed");
  }
}

async function setPlan(clerkId, plan) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ plan })
    .eq("clerk_id", clerkId);

  if (error) {
    console.error("Supabase plan update failed:", error.message);
  } else {
    console.log(`Plan for ${clerkId} set to ${plan}`);
  }
}