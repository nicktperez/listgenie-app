// pages/admin/index.js
import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const ENV_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

export default function AdminPage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 8 }}>Admin Dashboard</h1>
      <p className="chat-sub" style={{ marginBottom: 12 }}>
        Protected by ADMIN_TOKEN. Set <code>ADMIN_TOKEN</code> and <code>NEXT_PUBLIC_ADMIN_TOKEN</code> (same value) in Vercel.
      </p>

      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <div className="chat-sub" style={{ marginBottom: 8 }}>Sign in to continue.</div>
          <SignInButton mode="modal"><button className="btn">Sign in</button></SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <AdminInner />
      </SignedIn>
    </div>
  );
}

function AdminInner() {
  // Token handling (env first, fallback to localStorage if env missing)
  const [stored, setStored] = useState("");
  const token = useMemo(() => ENV_TOKEN || stored, [stored]);

  useEffect(() => {
    if (!ENV_TOKEN) setStored(localStorage.getItem("admin_token") || "");
  }, []);

  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    setErr(null); setNote(""); setLoading(true);
    try {
      const url1 = `/api/admin/index?q=${encodeURIComponent(q)}`;          // new path
      const url2 = `/api/admin/users/search?q=${encodeURIComponent(q)}`;   // legacy path
  
      // Try /api/admin/index first; if 404, fall back to /api/admin/users/search
      let r = await fetch(url1, { headers: { "X-Admin-Token": token || "" }});
      if (r.status === 404) {
        r = await fetch(url2, { headers: { "X-Admin-Token": token || "" }});
      }
  
      const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {}
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setList(j.users || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function setRole(u, role) {
    setErr(null); setNote("");
    try {
      const r = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
        },
        body: JSON.stringify({ userId: u.id, role }), // role: "admin" | "user"
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(`Role updated → ${role} for ${u.email || u.id}`);
      await fetchUsers();
    } catch (e) {
      setErr(e.message || "Failed to set role");
    }
  }

  async function setPlan(u, plan) {
    setErr(null); setNote("");
    try {
      const r = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
        },
        body: JSON.stringify({ userId: u.id, plan }), // plan: "pro" | "trial" | "expired"
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(`Plan updated → ${plan} for ${u.email || u.id}`);
      await fetchUsers();
    } catch (e) {
      setErr(e.message || "Failed to set plan");
    }
  }

  function saveTokenLocally() {
    localStorage.setItem("admin_token", stored || "");
    setNote("Saved token locally for this browser.");
  }

  useEffect(() => { fetchUsers(); }, []);

  return (
    <>
      {!ENV_TOKEN && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div className="chat-sub" style={{ marginBottom: 6 }}>
            NEXT_PUBLIC_ADMIN_TOKEN not set. Paste ADMIN_TOKEN here (stored locally):
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={stored}
              onChange={(e) => setStored(e.target.value)}
              placeholder="paste ADMIN_TOKEN…"
              className="textarea"
              style={{ minHeight: 40 }}
            />
            <button className="btn" onClick={saveTokenLocally}>Save token</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 12, marginBottom: 12, display:"flex", gap:12, alignItems:"center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name…"
          className="textarea"
          style={{ minHeight: 40, flex:1 }}
        />
        <button className="btn" onClick={fetchUsers} disabled={loading || !token}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      {note && <div className="card" style={{ padding: 10, marginBottom: 12 }}>{note}</div>}

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.2fr .9fr 1fr 1.2fr", gap:8, fontWeight:700, marginBottom:8 }}>
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Plan</div>
          <div>Created</div>
        </div>

        {!list.length && <div className="chat-sub">No users found.</div>}

        {list.map((u) => {
          const created = new Date(u.created_at).toLocaleString();
          const trialInfo = u.trial_end_date
            ? ` (until ${new Date(u.trial_end_date).toLocaleDateString()})`
            : "";
          return (
            <div
              key={u.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1.2fr .9fr 1fr 1.2fr",
                gap: 8,
                alignItems: "center",
                padding: "6px 0",
                borderTop: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {u.email || <span className="chat-sub">{u.clerk_id}</span>}
              </div>
              <div>{u.name || <span className="chat-sub">—</span>}</div>

              {/* Role */}
              <div>
                <span className="badge" style={{ marginRight: 6 }}>{u.role}</span>
                <div style={{ display:"inline-flex", gap:6, flexWrap:"wrap" }}>
                  <button className="link" onClick={() => setRole(u, "admin")}>make admin</button>
                  <button className="link" onClick={() => setRole(u, "user")}>make user</button>
                </div>
              </div>

              {/* Plan */}
              <div>
                <span className="badge" style={{ marginRight: 6 }}>{u.plan}</span>
                {u.plan === "trial" && trialInfo && <span className="chat-sub">{trialInfo}</span>}
                <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="link" onClick={() => setPlan(u, "pro")}>set pro</button>
                  <button className="link" onClick={() => setPlan(u, "trial")}>set trial</button>
                  <button className="link" onClick={() => setPlan(u, "expired")}>expire</button>
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