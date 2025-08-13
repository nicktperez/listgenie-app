import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";
import { useState } from "react";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function UpgradePage() {
  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="pricing-hero-content">
          <h1 className="pricing-title">
            Choose Your <span className="pricing-accent">Plan</span>
          </h1>
          <p className="pricing-subtitle">
            Start with a free trial, then unlock unlimited potential with Pro
          </p>
        </div>
      </section>

      <SignedOut>
        <div className="pricing-signin-section">
          <div className="pricing-signin-card">
            <h3>Sign in to view pricing</h3>
            <p>Create an account to start your free trial and see our plans</p>
            <SignInButton mode="modal">
              <button className="pricing-signin-btn">Get Started</button>
            </SignInButton>
            <Link href="/" className="pricing-back-link">← Back to Home</Link>
          </div>
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

  // Show Pro status banner at the top if user is already Pro
  const ProStatusBanner = () => {
    if (!isPro) return null;
    
    return (
      <div className="pricing-pro-banner">
        <div className="pro-banner-content">
          <div className="pro-banner-left">
            <div className="pro-badge">✅ Pro Member</div>
            <h3>You're already on Pro!</h3>
            <p>Enjoy unlimited access to all ListGenie features</p>
          </div>
          <div className="pro-banner-actions">
            <button className="pricing-btn primary" onClick={openPortal} disabled={loadingPortal}>
              {loadingPortal ? "Opening…" : "Manage Billing"}
            </button>
            <Link href="/chat" className="pricing-btn secondary">
              Back to Chat
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pricing-page">
      {/* Top Navigation Bar */}
      <nav className="pricing-navbar">
        <div className="pricing-navbar-content">
          <div className="pricing-navbar-brand">
            <div className="pricing-navbar-logo">🏠</div>
            <div className="pricing-navbar-text">ListGenie.ai</div>
          </div>
          <div className="pricing-navbar-actions">
            <Link href="/chat" className="pricing-navbar-btn">
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      <div className="pricing-plans-section">
        {/* Pro Status Banner - Shows if user is already Pro */}
        <ProStatusBanner />
      
      {/* Current Status Card - Only show for non-Pro users */}
      {!isPro && (
        <div className="pricing-status-card">
          <div className="status-content">
            <div className="status-info">
              <h3>Current Status</h3>
              <div className="status-details">
                <div className="status-text">
                  {isTrial ? `Trial Pro - ${daysLeft} days remaining` : "Trial Expired"}
                </div>
                <div className="status-description">
                  {isTrial ? "You have access to all Pro features" : "Upgrade to continue using ListGenie"}
                </div>
              </div>
            </div>
            <div className={`status-badge ${isTrial ? 'trial' : 'expired'}`}>
              {isTrial ? "TRIAL" : "EXPIRED"}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="pricing-plans-grid">
        {/* Free Trial Plan */}
        <div className="pricing-plan-card trial">
          <div className="plan-header">
            <div className="plan-icon">🎯</div>
            <h3 className="plan-name">Free Trial</h3>
            <div className="plan-price">
              <span className="price-amount">$0</span>
              <span className="price-period">/month</span>
            </div>
            <div className="plan-duration">14 days</div>
          </div>
          
          <div className="plan-features">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>All Pro features included</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Unlimited listing generations</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Premium AI models</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Flyer generation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Batch processing</span>
            </div>
          </div>
          
          <div className="plan-footer">
            <div className="trial-info">
              {isTrial ? `${daysLeft} days remaining` : "Trial expired"}
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="pricing-plan-card pro featured">
          <div className="plan-badge">Most Popular</div>
          <div className="plan-header">
            <div className="plan-icon">🚀</div>
            <h3 className="plan-name">Pro Plan</h3>
            <div className="plan-price">
              <span className="price-amount">$19</span>
              <span className="price-period">/month</span>
            </div>
            <div className="plan-duration">Billed monthly</div>
          </div>
          
          <div className="plan-features">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Unlimited listing generations</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Premium AI models</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Professional flyer generation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Batch processing (up to 20 properties)</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Advanced templates & customization</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Priority customer support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Early access to new features</span>
            </div>
          </div>
          
          <div className="plan-footer">
            {err && <div className="pricing-error">{err}</div>}
            <button 
              className="pricing-btn primary full-width" 
              onClick={onCheckout} 
              disabled={loading}
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
            <div className="plan-guarantee">
              <span className="guarantee-icon">🔒</span>
              <span>Cancel anytime • 14-day free trial</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Additional Info */}
      <div className="pricing-info-section">
        <div className="pricing-info-card">
          <h3>Why Choose ListGenie Pro?</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">⚡</div>
              <h4>Save Hours</h4>
              <p>Generate professional listings in seconds instead of hours</p>
            </div>
            <div className="info-item">
              <div className="info-icon">🎨</div>
              <h4>Professional Quality</h4>
              <p>AI-powered content that matches top real estate standards</p>
            </div>
            <div className="info-item">
              <div className="info-icon">🔄</div>
              <h4>Multiple Formats</h4>
              <p>Get MLS-ready, social media, and luxury versions instantly</p>
            </div>
            <div className="info-item">
              <div className="info-icon">📱</div>
              <h4>Always Available</h4>
              <p>24/7 access to generate listings whenever you need them</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="pricing-faq-section">
        <div className="pricing-faq-card">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>Yes! You can cancel your subscription at any time with no questions asked.</p>
            </div>
            <div className="faq-item">
              <h4>What happens after my trial ends?</h4>
              <p>You'll be automatically charged $19/month unless you cancel before the trial ends.</p>
            </div>
            <div className="faq-item">
              <h4>Is there a setup fee?</h4>
              <p>No setup fees! Just $19/month after your free trial.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="pricing-back-section">
        <Link href="/" className="pricing-back-btn">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}