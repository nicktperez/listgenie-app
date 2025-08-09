// pages/listings.js
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ListingRender } from "@/components/ListingRender";

export default function ListingsPage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 6 }}>Saved Listings</h1>
      <p className="chat-sub" style={{ marginBottom: 16 }}>
        View, copy, and manage your generated drafts.
      </p>

      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <p className="chat-sub" style={{ marginBottom: 8 }}>
            Please sign in to view your saved listings.
          </p>
          <SignInButton mode="modal">
            <button className="btn">Sign in</button>
          </SignInButton>
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
  const [err, setErr] = useState(null);
  const [expanded, setExpanded] = useState(null); // id that's expanded
  const [deleting, setDeleting] = useState(null);

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const r = await fetch("/api/listings/list");
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed to load");
      setItems(j.items || []);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id) {
    if (!confirm("Delete this listing?")) return;
    try {
      setDeleting(id);
      const r = await fetch("/api/listings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
      setItems((arr) => arr.filter((x) => x.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="card" style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div className="error">{err}</div>;
  if (!items.length) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ marginBottom: 8 }}>No saved listings yet.</div>
        <a className="link" href="/chat">Go to Chat</a>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((it) => {
        const date = new Date(it.created_at);
        const title = it.title || it.payload?.headline || "Listing";
        const isOpen = expanded === it.id;

        return (
          <div key={it.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>{title}</div>
              <div className="chat-sub" style={{ marginLeft: "auto" }}>
                {date.toLocaleString()}
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setExpanded(isOpen ? null : it.id)}>
                {isOpen ? "Hide" : "View"}
              </button>
              <a className="link" href="/chat">Open Chat</a>
              <button
                className="link"
                onClick={() => onCopy(fullText(it.payload))}
                type="button"
              >
                Copy MLS Text
              </button>
              <button
                className="link"
                onClick={() => onDelete(it.id)}
                disabled={deleting === it.id}
                type="button"
              >
                {deleting === it.id ? "Deleting…" : "Delete"}
              </button>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12 }}>
                <ListingRender data={it.payload} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function fullText(data){
  if (!data) return "";
  const parts = [data.headline, data?.mls?.body, ...(data?.mls?.bullets||[]).map(b=>`• ${b}`)];
  return parts.filter(Boolean).join("\n\n");
}
function onCopy(text){
  try { navigator.clipboard.writeText(text); } catch {}
}