import React from "react";
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import useUserPlan from "@/hooks/useUserPlan";

export default function NavBar() {
  const { isSignedIn } = useUser();
  const { isPro } = useUserPlan();

  return (
    <nav
      className="nav-wrap"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(14, 11, 22, 0.85)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        className="nav-inner"
        style={{
          maxWidth: 940,
          margin: "0 auto",
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Left: brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: '6px'
            }}
          >
            <img src="/logo_icon.png" alt="ListGenie" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <strong>ListGenie.ai</strong>
        </Link>

        {/* Left: primary nav */}
        <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
          <Link href="/chat" className="link">Chat</Link>
          <SignedIn>
            <Link href="/dashboard" className="link">Dashboard</Link>
          </SignedIn>
        </div>

        {/* Right: actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="link">Sign in</button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {!isPro && <a href="/upgrade" className="link">Upgrade</a>}

            {isPro && (
              <form action="/api/stripe/create-portal-session" method="post" style={{ display: "inline" }}>
                <button className="link" type="submit">Billing</button>
              </form>
            )}

            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}