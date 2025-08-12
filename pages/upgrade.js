import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";
import { useState } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function UpgradePage() {
  return (
    <div className="chat-wrap">
      <h1 className="chat-title" style={{ marginBottom: 8 }}>Upgrade to Pro</h1>
      <p className="chat-sub" style={{ marginBottom: 16 }}>
        Unlock unlimited generations, advanced templates, and premium features.
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
  const { isPro, daysLeft, isTrial } = useUserPlan();
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
        <div style={{ marginBottom: 10 }}>✅ You're on <strong>Pro</strong>.</div>
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
    <div className="upgrade-container">
      {/* Current Status */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Current Status</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", color: "var(--text-dim)", marginBottom: 4 }}>
              {isTrial ? `Trial Pro - ${daysLeft} days remaining` : "Trial Expired"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600" }}>
              {isTrial ? "You have access to all Pro features" : "Upgrade to continue using ListGenie"}
            </div>
          </div>
          <div style={{ 
            fontSize: "12px", 
            padding: "4px 8px", 
            borderRadius: "6px",
            background: isTrial ? "rgba(124, 231, 196, 0.1)" : "rgba(255, 99, 99, 0.1)",
            color: isTrial ? "#7ce7c4" : "#ff6363"
          }}>
            {isTrial ? "TRIAL" : "EXPIRED"}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16 }}>Pro Plan Features</h3>
        <div style={{ textAlign: "center" }}>
          <h4 style={{ marginBottom: 8, color: "#86a2ff" }}>Pro Plan</h4>
          <div style={{ fontSize: "24px", fontWeight: "700", marginBottom: 4 }}>$19</div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: 16 }}>per month</div>
          <ul style={{ textAlign: "left", fontSize: "14px", lineHeight: "1.6", maxWidth: "300px", margin: "0 auto" }}>
            <li>✅ Unlimited listing generations</li>
            <li>✅ Premium AI models</li>
            <li>✅ Flyer generation</li>
            <li>✅ Batch processing (up to 20 properties)</li>
            <li>✅ Advanced templates</li>
            <li>✅ Priority support</li>
          </ul>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="card" style={{ padding: 16, maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Ready to unlock unlimited potential?</h3>
          <p style={{ fontSize: "14px", color: "var(--text-dim)" }}>
            Join thousands of realtors who trust ListGenie for their listing needs.
          </p>
        </div>
        
        {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="btn" onClick={onCheckout} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Redirecting…" : "Upgrade to Pro — $19/month"}
        </button>
        <div className="chat-sub" style={{ marginTop: 8, textAlign: "center" }}>
          Cancel anytime. 14-day free trial included.
        </div>
      </div>
    </div>
  );
}