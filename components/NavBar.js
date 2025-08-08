// components/NavBar.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  // close the sheet on route change/back/forward
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  return (
    <header className="app-header">
      <div className="container app-nav">
        {/* Brand */}
        <Link href="/" className="brand">
          <span style={{ fontWeight: 900 }}>ListGenie</span>
          <span className="dot">.ai</span>
        </Link>

        {/* Desktop links */}
        <nav className="nav-links">
          <Link href="/chat">Chat</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <SignedOut>
            <Link href="/sign-in" className="btn">Sign in</Link>
            <Link href="/sign-up" className="btn primary">Get Started</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/chat" className="btn">Start Chatting</Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: 32, height: 32 },
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="nav-toggle"
          aria-expanded={open ? "true" : "false"}
          aria-label="Toggle navigation"
          onClick={() => setOpen((s) => !s)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        {/* Mobile sheet */}
        <div className={`mobile-sheet ${open ? "open" : ""}`}>
          <Link href="/chat" className="sheet-link" onClick={() => setOpen(false)}>Chat</Link>
          <Link href="/#pricing" className="sheet-link" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/#faq" className="sheet-link" onClick={() => setOpen(false)}>FAQ</Link>
          <SignedOut>
            <Link href="/sign-in" className="sheet-link" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/sign-up" className="sheet-link" onClick={() => setOpen(false)}>Get Started</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/chat" className="sheet-link" onClick={() => setOpen(false)}>Start Chatting</Link>
            <div className="sheet-link" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <UserButton afterSignOutUrl="/" />
              <span className="muted">Account</span>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}