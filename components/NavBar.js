// components/NavBar.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/0 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">
            ListGenie
            <span className="align-top text-sky-400">.ai</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/chat" className="text-white/80 hover:text-white transition">
            Chat
          </Link>
          <Link href="/pricing" className="text-white/80 hover:text-white transition">
            Pricing
          </Link>
          <Link
            href="https://listgenie.ai"
            className="text-white/60 hover:text-white transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </Link>

          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-xl bg-sky-400 text-sky-950 px-3.5 py-2 font-semibold shadow-[0_8px_30px_rgba(56,189,248,0.35)] hover:shadow-[0_10px_40px_rgba(56,189,248,0.45)]"
            >
              Sign in
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "ring-2 ring-sky-400/60" } }} />
          </SignedIn>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d={open ? "M18 6L6 18M6 6l12 12" : "M3 6h18M3 12h18M3 18h18"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/30 backdrop-blur">
          <div className="px-4 py-3 space-y-2">
            <Link href="/chat" onClick={() => setOpen(false)} className="block text-white/90">
              Chat
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="block text-white/90">
              Pricing
            </Link>
            <Link
              href="https://listgenie.ai"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block text-white/80"
            >
              Website
            </Link>

            <div className="pt-2">
              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="inline-block rounded-xl bg-sky-400 text-sky-950 px-3.5 py-2 font-semibold shadow-[0_8px_30px_rgba(56,189,248,0.35)]"
                >
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}