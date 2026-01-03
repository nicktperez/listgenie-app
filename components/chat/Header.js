import React from "react";
import Link from 'next/link';
import { UserButton } from "@clerk/nextjs";

export default function ChatHeader({ isListingMode, onNewListing, isPro, isTrial }) {
  return (
    <nav className="top-navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="navbar-content" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto' }}>
        <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 1, textDecoration: 'none' }}>
          <div className="logo" style={{ fontSize: '24px', display: 'flex', alignItems: 'center' }}>
            <img src="/logo_icon.png" alt="ListGenie" style={{ width: 28, height: 28 }} />
          </div>
          <div className="brand-text" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>ListGenie.ai</div>
        </Link>
        <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {isListingMode && (
            <button
              className="new-listing-btn"
              onClick={onNewListing}
              title="Start a new listing"
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#c4b5fd',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>
                <img src="/sparkles_icon.png" alt="" style={{ width: 16, height: 16 }} />
              </span> New Listing
            </button>
          )}
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" className="nav-link" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link href="/pricing" className="billing-link" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
              {isPro ? 'Billing' : 'Pricing'}
            </Link>
            <div className={`plan-badge ${isPro ? 'pro' : isTrial ? 'trial' : 'free'}`} style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: isPro ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : isTrial ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: isPro ? 'white' : isTrial ? '#ffc107' : '#94a3b8',
              border: `1px solid ${isPro ? 'transparent' : isTrial ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}>
              {isPro ? "PRO" : isTrial ? "TRIAL" : "FREE"}
            </div>
            <div className="profile-section">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
