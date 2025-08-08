// components/NavBar.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Brand (no stray spaces) */}
        <Link href="/" className="brand" aria-label="ListGenie Home">
          <span className="brand-name">ListGenie</span><span className="brand-dot">.ai</span>
        </Link>

        <nav className="nav-links">
          <Link href="/chat">Chat</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
        </nav>

        <div className="nav-cta">
          <SignedOut>
            <Link href="/sign-in" className="btn btn-ghost">Sign in</Link>
            <Link href="/sign-up" className="btn btn-primary">Get Started</Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile hamburger */}
        <input id="nav-toggle" type="checkbox" className="nav-toggle" aria-label="Toggle Menu" />
        <label htmlFor="nav-toggle" className="hamburger" aria-hidden="true">
          <span />
          <span />
          <span />
        </label>

        {/* Mobile drawer */}
        <div className="mobile-menu">
          <Link href="/chat">Chat</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <SignedOut>
            <Link href="/sign-in" className="btn btn-ghost w-full">Sign in</Link>
            <Link href="/sign-up" className="btn btn-primary w-full">Get Started</Link>
          </SignedOut>
          <SignedIn>
            <div className="mobile-user">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}