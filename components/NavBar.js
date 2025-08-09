import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function NavBar() {
  return (
    <header className="lg-nav">
      <div className="lg-nav__inner">

        {/* LEFT CLUSTER: brand + links */}
        <div className="lg-nav__left">
          <Link href="/" className="lg-nav__brand" aria-label="ListGenie Home">
            <span className="lg-nav__brand-text">ListGenie</span>
            <span className="lg-nav__brand-ai">.ai</span>
          </Link>

          {/* Desktop links */}
          <nav className="lg-nav__links" aria-label="Primary">
            <Link href="/chat" className="lg-nav__link is-active">Chat</Link>
          </nav>
        </div>

        {/* RIGHT: auth */}
        <div className="lg-nav__right">
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonBox: { outline: "none" } } }} />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button className="lg-btn lg-btn--primary">Sign in</button>
            </SignInButton>
          </SignedOut>
        </div>

      </div>
    </header>
  );
}