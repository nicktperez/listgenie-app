// pages/api/admin/index.js
import { getAuth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  const token = req.headers["x-admin-token"];
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  let isAuthorized = false;

  // 1. Check Token (Bootstrap/System access)
  if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
    isAuthorized = true;
  }
  // 2. Check User Role (Standard Admin access)
  else {
    try {
      const { userId } = getAuth(req);
      if (userId) {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("plan") // We will assume a 'role' column exists or use metadata differently, 
          // but since the previous code referenced 'role', let's check it.
          // Wait, the schema I just wrote didn't explicitly add a 'role' column 
          // to the text description but the previous code used it.
          // I should probably add the role column to the schema if it's missing, 
          // or just assume it's there from previous migrations.
          // Looking at the previous file content, it selected 'role'.
          // I will verify the schema shortly. For now, let's assume 'role' exists or we add it.
          .eq("id", userId)
          .single();

        // Actually, let's just use the existence of the admin token as the primary guard for now 
        // as requested by the user ("help me with that"), 
        // and I'll add a 'role' check if I can confirm the column exists.
        // The previous file `index.js` DID select 'role'.

        // Let's stick to the robust token check first as it's what's currently configured,
        // but I will fix the schema bug.
      }
    } catch (e) {
      console.error("Auth check failed", e);
    }
  }

  // REVERTING TO SIMPLE TOKEN CHECK + FIXING SCHEMA BUGS because I cannot confirm 'role' column existence in the NEW schema I just pasted.
  // The new schema I pasted for the user:
  // create table users (id, email, plan, trial_end_date, stripe_customer_id, created_at, updated_at)
  // IT DOES NOT HAVE ROLE.
  // So I must rely on the Token or specific email check.

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    // Optional: Allow specific hardcoded email if you extracted it
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const q = (req.query.q || "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize || "20", 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base filter
    const base = supabaseAdmin
      .from("users")
      .select("id, email, plan, trial_end_date, created_at", { count: "exact" }) // Removed clerk_id, name, role
      .order("created_at", { ascending: false });

    // Note: 'name' and 'role' were also not in my new schema. 
    // If we want them, we need to alter the table.
    // For now, removing them to prevent 500 errors.

    const filtered = q ? base.ilike('email', `%${q}%`) : base;

    // Count total
    const { count, error: countErr } = await filtered.range(0, 0);
    if (countErr) throw countErr;

    // Page of data
    const { data, error } = await filtered.range(from, to);
    if (error) throw error;

    return res.status(200).json({ ok: true, users: data || [], page, pageSize, total: count || 0 });
  } catch (err) {
    console.error("Admin index error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}