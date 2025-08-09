import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const close = () => setOpen(false);
    router.events?.on("routeChangeComplete", close);
    return () => router.events?.off("routeChangeComplete", close);
  }, [router]);

  const isChat = router.pathname === "/chat";

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

        {/* Desktop links — only Chat */}
        <nav className="lg-nav__links" aria-label="Primary">
          <Link
            href="/chat"
            className={`lg-nav__link ${isChat ? "is-active" : ""}`}
          >
            Chat
          </Link>
        </nav>

        {/* Right side: auth + hamburger */}
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

          <button
            className={`lg-nav__hamburger ${open ? "is-open" : ""}`}
            aria-label="Toggle menu"
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
        <Link
          href="/"
          className={`lg-nav__mobile-link ${router.pathname === "/" ? "is-active" : ""}`}
        >
          Home
        </Link>

        <Link
          href="/chat"
          className={`lg-nav__mobile-link ${isChat ? "is-active" : ""}`}
        >
          Chat
        </Link>

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