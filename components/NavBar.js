import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close mobile menu on route change
  useEffect(() => {
    const handleRoute = () => setOpen(false);
    router.events?.on("routeChangeComplete", handleRoute);
    return () => router.events?.off("routeChangeComplete", handleRoute);
  }, [router]);

  return (
    <header className="lg-nav">
      <div className="lg-nav__inner">
        {/* Brand */}
        <Link href="/" className="lg-nav__brand" aria-label="ListGenie Home">
          <span className="lg-nav__brand-dot">✨</span>
          <span className="lg-nav__brand-text">
            ListGenie<span className="lg-nav__brand-ai">.ai</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="lg-nav__links" aria-label="Primary">
          <Link href="/chat" className="lg-nav__link">
            Chat
          </Link>
          <Link href="/pricing" className="lg-nav__link">
            Pricing
          </Link>
          <a
            href="https://listgenie.ai"
            className="lg-nav__link"
            target="_blank"
            rel="noreferrer"
          >
            Website
          </a>
        </nav>

        {/* Right side: Auth / CTA */}
        <div className="lg-nav__right">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="lg-btn lg-btn--ghost">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: { avatarBox: { width: 34, height: 34 } },
              }}
            />
          </SignedIn>

          {/* Hamburger (mobile only) */}
          <button
            className={`lg-nav__hamburger ${open ? "is-open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={open ? "true" : "false"}
            onClick={() => setOpen((s) => !s)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg-nav__mobile ${open ? "is-open" : ""}`}>
        <Link href="/chat" className="lg-nav__mobile-link">
          Chat
        </Link>
        <Link href="/pricing" className="lg-nav__mobile-link">
          Pricing
        </Link>
        <a
          href="https://listgenie.ai"
          className="lg-nav__mobile-link"
          target="_blank"
          rel="noreferrer"
        >
          Website
        </a>

        <div className="lg-nav__mobile-auth">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="lg-btn lg-btn--primary">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: { avatarBox: { width: 36, height: 36 } },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}