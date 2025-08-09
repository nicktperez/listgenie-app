import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useState } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function UpgradePage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 8 }}>Upgrade to Pro</h1>
      <p className="chat-sub" style={{ marginBottom: 16 }}>
        Unlock batch generation, advanced templates, and higher usage limits.
      </p>

      <SignedOut>
        <div className="card" style={{ padding: 16 }}>
          <p className="chat-sub" style={{ marginBottom: 8 }}>
            Please sign in to upgrade your account.
          </p>
          <SignInButton mode="modal">
            <button className="btn">Sign in</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <UpgradeInner />
      </SignedIn>
    </div>
  );
}

function UpgradeInner() {
  const { user } = useUser();
  const { isPro } = useUserPlan();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const onCheckout = async () => {
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch("/api/stripe/create-checkout-session", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || "Failed to start checkout");
      window.location.href = json.url;
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [err2, setErr2] = useState(null);
  
    const openPortal = async () => {
      try {
        setErr2(null);
        setLoadingPortal(true);
        const r = await fetch("/api/stripe/create-portal-session", { method: "POST" });
        const j = await r.json();
        if (!r.ok || !j?.url) throw new Error(j?.error || "Could not open billing portal.");
        window.location.href = j.url;
      } catch (e) {
        setErr2(e?.message || "Something went wrong.");
      } finally {
        setLoadingPortal(false);
      }
    };
  
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ marginBottom: 10 }}>✅ You’re on <strong>Pro</strong>.</div>
        {err2 && <div className="error" style={{ marginBottom: 10 }}>{err2}</div>}
        <button className="btn" onClick={openPortal} disabled={loadingPortal}>
          {loadingPortal ? "Opening…" : "Manage Billing"}
        </button>
        <a href="/chat" className="link" style={{ display: "inline-block", marginLeft: 8 }}>
          Back to Chat
        </a>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16, maxWidth: 520 }}>
      <ul style={{ margin: "0 0 12px 18px" }}>
        <li>Batch generate listings</li>
        <li>Advanced templates</li>
        <li>Higher usage limits</li>
      </ul>
      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
      <button className="btn" onClick={onCheckout} disabled={loading}>
        {loading ? "Redirecting…" : "Upgrade — $/mo"}
      </button>
      <div className="chat-sub" style={{ marginTop: 8 }}>Cancel anytime.</div>
    </div>
  );
}