// pages/admin/index.js
import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import PerformanceAnalytics from "../../components/PerformanceAnalytics";

const ENV_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

export default function AdminPage() {
  return (
    <div className="chat-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 className="chat-title" style={{ marginBottom: 8 }}>Admin Dashboard</h1>
          <p className="chat-sub" style={{ marginBottom: 0 }}>
            Protected by ADMIN_TOKEN. Set <code>ADMIN_TOKEN</code> and <code>NEXT_PUBLIC_ADMIN_TOKEN</code> (same value) in Vercel.
          </p>
        </div>
        <button
          onClick={() => setAnalyticsOpen(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          📊 Analytics Dashboard
        </button>
      </div>

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

// Tiny toast helper
function useToast() {
  const [toast, setToast] = useState(null); // { type:'ok'|'err', msg:string }
  function show(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }
  const ui = toast ? (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1000,
        padding: "10px 14px",
        borderRadius: 10,
        background: toast.type === "ok" ? "rgba(56,176,0,.2)" : "rgba(255,99,99,.2)",
        border: `1px solid ${toast.type === "ok" ? "rgba(56,176,0,.6)" : "rgba(255,99,99,.6)"}`,
        backdropFilter: "blur(6px)",
      }}
    >
      {toast.msg}
    </div>
  ) : null;
  return [ui, show];
}

function AdminInner() {
  // Token handling
  const [stored, setStored] = useState("");
  const token = useMemo(() => ENV_TOKEN || stored, [stored]);
  useEffect(() => {
    if (!ENV_TOKEN) setStored(localStorage.getItem("admin_token") || "");
  }, []);

  // State
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Toast, showToast] = useToast();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Load q & page from URL on first render
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get("q") || "";
    const p0 = parseInt(sp.get("page") || "1", 10);
    setQ(q0);
    setPage(Number.isFinite(p0) && p0 > 0 ? p0 : 1);
  }, []);

  // Write q & page into URL (no reload)
  function syncUrl(nextQ, nextPage) {
    const sp = new URLSearchParams(window.location.search);
    if (nextQ !== undefined) {
      if (nextQ) sp.set("q", nextQ);
      else sp.delete("q");
    }
    if (nextPage !== undefined) sp.set("page", String(nextPage));
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, "", url);
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      syncUrl(q, 1);
      setPage(1);
      fetchUsers(1, pageSize, q);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Load on page change
  useEffect(() => {
    fetchUsers(page, pageSize, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchUsers(p = page, ps = pageSize, query = q) {
    if (!token) return;
    setErr(null); setLoading(true);
    try {
      const url1 = `/api/admin/index?q=${encodeURIComponent(query)}&page=${p}&pageSize=${ps}`;
      const url2 = `/api/admin/users/search?q=${encodeURIComponent(query)}`;
  
      let r = await fetch(url1, { headers: { "X-Admin-Token": token || "" } });
      // If the new endpoint isn't present in this deploy, try the legacy one
      if (r.status === 404) {
        r = await fetch(url2, { headers: { "X-Admin-Token": token || "" } });
      }
  
      const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {}
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  
      // Support either shape
      setList(j.users || []);
      setTotal(typeof j.total === "number" ? j.total : (j.users ? j.users.length : 0));
      syncUrl(query, p);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setList([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function setRole(u, role) {
    try {
      const r = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token || "" },
        body: JSON.stringify({ userId: u.id, role }), // "admin" | "user"
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      showToast(`Role → ${role} for ${u.email || u.id}`);
      fetchUsers();
    } catch (e) {
      showToast(e.message || "Failed to set role", "err");
    }
  }

  async function setPlan(u, plan) {
    try {
      const r = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token || "" },
        body: JSON.stringify({ userId: u.id, plan }), // "pro" | "trial" | "expired"
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      showToast(`Plan → ${plan} for ${u.email || u.id}`);
      fetchUsers();
    } catch (e) {
      showToast(e.message || "Failed to set plan", "err");
    }
  }

  async function openBilling(u) {
    try {
      const r = await fetch("/api/admin/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token || "" },
        body: JSON.stringify({ userId: u.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j.url) throw new Error(j?.error || `HTTP ${r.status}`);
      window.open(j.url, "_blank");
    } catch (e) {
      showToast(e.message || "Failed to open billing portal", "err");
    }
  }

  async function backfillStripe() {
    try {
      const r = await fetch("/api/admin/stripe/backfill", {
        method: "POST",
        headers: { "X-Admin-Token": token || "" },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      showToast(`Backfill: created ${j.created}/${j.checked} (${j.mode})`);
      fetchUsers();
    } catch (e) {
      showToast(e.message || "Backfill failed", "err");
    }
  }

  function copyEmail(u) {
    if (!u.email) return;
    navigator.clipboard.writeText(u.email).then(
      () => showToast("Email copied"),
      () => showToast("Copy failed", "err")
    );
  }

  function saveTokenLocally() {
    localStorage.setItem("admin_token", stored || "");
    showToast("Saved token in this browser");
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = total ? Math.min(page * pageSize, total) : 0;

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
  <button className="btn" onClick={() => fetchUsers()} disabled={loading || !token}>
    {loading ? "Loading…" : "Refresh"}
  </button>
  <button className="btn" onClick={backfillStripe} disabled={!token}>
    Backfill Stripe
  </button>
</div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"2.1fr 1.1fr .85fr 1.1fr 1.3fr", gap:8, fontWeight:700, marginBottom:8 }}>
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Plan</div>
          <div>Created</div>
        </div>

        {!list.length && <div className="chat-sub">No users found.</div>}

        {list.map((u) => {
          const created = new Date(u.created_at).toLocaleString();

          const trialDaysLeft = u.plan === "trial" && u.trial_end_date
            ? Math.max(0, Math.ceil((new Date(u.trial_end_date).getTime() - Date.now()) / (24*60*60*1000)))
            : null;

          return (
            <div key={u.id} style={{ display:"grid", gridTemplateColumns:"2.1fr 1.1fr .85fr 1.1fr 1.3fr", gap:8, alignItems:"center", padding:"6px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
              <div style={{ overflow:"hidden", textOverflow:"ellipsis", display:"flex", alignItems:"center", gap:8 }}>
                <span title={u.email || u.clerk_id}>{u.email || <span className="chat-sub">{u.clerk_id}</span>}</span>
                {u.email && <button className="link" onClick={() => copyEmail(u)}>copy</button>}
                <button className="link" onClick={() => openBilling(u)}>billing</button>
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

              {/* Plan + countdown */}
              <div>
                <span className="badge" style={{ marginRight: 6 }}>
                  {u.plan}{trialDaysLeft !== null ? ` • ${trialDaysLeft}d left` : ""}
                </span>
                <div style={{ display:"inline-flex", gap:6, flexWrap:"wrap" }}>
                  <button className="link" onClick={() => setPlan(u, "pro")}>set pro</button>
                  <button className="link" onClick={() => setPlan(u, "trial")}>set trial</button>
                  <button className="link" onClick={() => setPlan(u, "expired")}>expire</button>
                </div>
              </div>

              <div className="chat-sub">{created}</div>
            </div>
          );
        })}

        {/* Pagination */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 12 }}>
          <div className="chat-sub">
            {total ? `Showing ${start}-${end} of ${total}` : "—"}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn" disabled={page<=1} onClick={()=>{ setPage(p=>Math.max(1,p-1)); }}>
              ◀ Prev
            </button>
            <div className="chat-sub" style={{ alignSelf:"center" }}>
              Page {page} / {totalPages}
            </div>
            <button className="btn" disabled={page>=totalPages} onClick={()=>{ setPage(p=>Math.min(totalPages,p+1)); }}>
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* Performance Analytics Dashboard */}
      <PerformanceAnalytics 
        isOpen={analyticsOpen} 
        onClose={() => setAnalyticsOpen(false)} 
      />

      {Toast}
    </>
  );
}