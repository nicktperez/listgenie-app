import React from "react";

export default function ChatHeader({ isListingMode, onNewListing, isPro, isTrial }) {
  return (
    <nav className="top-navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <div className="logo">🏠</div>
          <div className="brand-text">ListGenie.ai</div>
        </div>
        <div className="navbar-right">
          {isListingMode && (
            <button
              className="new-listing-btn"
              onClick={onNewListing}
              title="Start a new listing"
            >
              ✨ New Listing
            </button>
          )}
          <div className="navbar-links">
            <a href="/upgrade" className="billing-link">
              Billing
            </a>
            <div className="plan-badge">
              {isPro ? "Pro" : isTrial ? "Trial" : "Expired"}
            </div>
            <div className="profile-section">
              <div className="profile-avatar">👤</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
