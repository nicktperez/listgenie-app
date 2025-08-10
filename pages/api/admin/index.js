// pages/admin/index.js
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

export default function AdminPage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 8 }}>Admin Dashboard</h1>
      <p className="chat-sub" style={{ marginBottom: 12 }}>
        Protected by ADMIN_TOKEN. Make sure both <code>ADMIN_TOKEN</code> and <code>NEXT_PUBLIC_ADMIN_TOKEN</code> are set (same value).
      </p>

      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <div className="chat-sub" style={{ marginBottom: 8 }}>Sign in as an admin to continue.</div>
          <SignInButton mode="modal">
            <button className="btn">Sign in</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <AdminInner />
      </SignedIn>
    </div>
  );
}

function AdminInner() {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function fetchUsers() {
    try {
      setErr(null);
      setLoading(true);
      const r = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`, {
        headers: { "X-Admin-Token": ADMIN_TOKEN || "" },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setList(j.users || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function setPlan(u, plan) {
    try {
      setNote("");
      const body = { clerk_id: u.clerk_id, plan };
      if (plan === "trial" && !u.trial_end_date) {
        // default 14-day trial from now
        body.trial_end_date = new Date(Date.now() + 14*24*60*60*1000).toISOString();
      }
      const r = await fetch("/api/admin/users/set-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": ADMIN_TOKEN || "",
        },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(`Plan updated → ${plan} for ${u.email || u.name || u.clerk_id}`);
      fetchUsers();
    } catch (e) {
      setErr(e.message || "Failed to set plan");
    }
  }

  async function setRole(u, role) {
    try {
      setNote("");
      const r = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": ADMIN_TOKEN || "",
        },
        body: JSON.stringify({ clerk_id: u.clerk_id, role }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(`Role updated → ${role} for ${u.email || u.name || u.clerk_id}`);
      fetchUsers();
    } catch (e) {
      setErr(e.message || "Failed to set role");
    }
  }

  async function grantMeAdmin() {
    try {
      const r = await fetch("/api/admin/grant-self", {
        method: "POST",
        headers: { "X-Admin-Token": ADMIN_TOKEN || "" },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(`You are now admin${j?.email ? ` (${j.email})` : ""}.`);
    } catch (e) {
      setErr(e.message || "Failed to grant admin");
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  return (
    <>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="textarea"
            style={{ minHeight: 40 }}
          />
          <button className="btn" onClick={fetchUsers} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button className="link" onClick={grantMeAdmin}>Make me Admin</button>
        </div>
      </div>

      {err && (
        <div className="error" style={{ marginBottom: 12 }}>
          {err}
        </div>
      )}
      {note && (
        <div className="card" style={{ padding: 10, marginBottom: 12 }}>
          {note}
        </div>
      )}

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 0.9fr 1fr 1.2fr", gap: 8, fontWeight: 700, marginBottom: 8 }}>
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Plan</div>
          <div>Created</div>
        </div>

        {!list.length && <div className="chat-sub">No users found.</div>}

        {list.map((u) => {
          const created = new Date(u.created_at).toLocaleString();
          const trialInfo = u.trial_end_date ? ` (until ${new Date(u.trial_end_date).toLocaleDateString()})` : "";
          return (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 0.9fr 1fr 1.2fr", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{u.email || <span className="chat-sub">{u.clerk_id}</span>}</div>
              <div>{u.name || <span className="chat-sub">—</span>}</div>

              <div>
                <span className="badge" style={{ marginRight: 6 }}>{u.role}</span>
                <button className="link" onClick={() => setRole(u, "admin")}>make admin</button>
                {" · "}
                <button className="link" onClick={() => setRole(u, "pro")}>make pro</button>
                {" · "}
                <button className="link" onClick={() => setRole(u, "free")}>make free</button>
              </div>

              <div>
                <span className="badge" style={{ marginRight: 6 }}>{u.plan}</span>
                {u.plan === "trial" && trialInfo && <span className="chat-sub">{trialInfo}</span>}
                <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="link" onClick={() => setPlan(u, "pro")}>set pro</button>
                  <button className="link" onClick={() => setPlan(u, "trial")}>set trial</button>
                  <button className="link" onClick={() => setPlan(u, "expired")}>expire</button>
                  <button className="link" onClick={() => setPlan(u, "free")}>set free</button>
                </div>
              </div>

              <div className="chat-sub">{created}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}