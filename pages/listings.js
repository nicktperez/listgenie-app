// pages/listings.js
import { useEffect, useMemo, useState } from "react";
import ListingRender from "@/components/ListingRender";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

function useToast() {
  const [t, setT] = useState(null); // {msg, type:'ok'|'err'}
  const show = (msg, type = "ok") => { setT({ msg, type }); setTimeout(() => setT(null), 2200); };
  const ui = t ? (
    <div
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 1000,
        padding: "10px 14px", borderRadius: 10,
        background: t.type === "ok" ? "rgba(56,176,0,.18)" : "rgba(255,99,99,.18)",
        border: `1px solid ${t.type === "ok" ? "rgba(56,176,0,.55)" : "rgba(255,99,99,.55)"}`,
        backdropFilter: "blur(6px)",
      }}
    >{t.msg}</div>
  ) : null;
  return [ui, show];
}

export default function ListingsPage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 8 }}>Listings</h1>
      <p className="chat-sub" style={{ marginBottom: 16 }}>
        Saved outputs from Chat. Copy, export, or delete.
      </p>

      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <div className="chat-sub" style={{ marginBottom: 8 }}>Please sign in to view your listings.</div>
          <SignInButton mode="modal"><button className="btn">Sign in</button></SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <ListingsInner />
      </SignedIn>
    </div>
  );
}

function ListingsInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [Toast, showToast] = useToast();

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/listings/all");
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(j.items || []);
    } catch (e) {
      showToast(e.message || "Failed to load", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    const ok = confirm("Delete this listing? This cannot be undone.");
    if (!ok) return;
    try {
      const r = await fetch("/api/listings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      showToast("Deleted");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      showToast(e.message || "Delete failed", "err");
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const title = (it.title || "").toLowerCase();
      const tone = (it.payload?.tone || "").toLowerCase();
      const text = (it.payload?.output || "").toLowerCase();
      return title.includes(s) || tone.includes(s) || text.includes(s);
    });
  }, [q, items]);

  return (
    <>
      <div className="card" style={{ padding: 10, marginBottom: 12, display:"flex", gap:10, alignItems:"center" }}>
        <input
          className="textarea"
          placeholder="Search title, tone, or text…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          style={{ minHeight: 40, flex:1 }}
        />
        <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
      </div>

      {!filtered.length && !loading && (
        <div className="card" style={{ padding: 16 }}>
          <div className="chat-sub">No listings yet. Generate one in Chat and click “save as listing”.</div>
        </div>
      )}

      <div style={{ display:"grid", gap: 14 }}>
        {filtered.map((it) => (
          <div key={it.id} className="card" style={{ padding: 0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding: 10, borderBottom:"1px solid rgba(255,255,255,.08)" }}>
              <div className="chat-sub">
                Saved: {new Date(it.created_at).toLocaleString()}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="link" onClick={() => onDelete(it.id)}>delete</button>
              </div>
            </div>

            <div style={{ padding: 10 }}>
              <ListingRender
                title={it.title}
                content={it.payload?.output || ""}
                meta={{ tone: it.payload?.tone, created_at: it.created_at }}
              />
            </div>
          </div>
        ))}
      </div>

      {Toast}
    </>
  );
}