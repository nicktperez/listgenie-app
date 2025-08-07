// components/NavBar.js
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/nextjs";

export default function NavBar() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  // On first render after sign-in, make sure the user exists in Supabase
  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        await fetch("/api/user/init", { method: "POST" });
      } catch (e) {
        // Silent fail is fine for first-boot init
        console.error("User init failed:", e);
      }
    })();
  }, [isSignedIn]);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md border px-2.5 py-2"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {/* hamburger */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="text-lg font-bold tracking-tight">
            ListGenie
          </Link>
        </div>

        {/* Center: Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm hover:underline">Dashboard</Link>
          <Link href="/chat" className="text-sm hover:underline">Chat</Link>
          <Link href="/openrouter" className="text-sm hover:underline">Models</Link>
          <Link href="/pricing" className="text-sm hover:underline">Pricing</Link>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/account"
              className="hidden md:inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Account
            </Link>
            <UserButton
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-2">
            <Link href="/dashboard" className="block py-1 text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
            <Link href="/chat" className="block py-1 text-sm" onClick={() => setOpen(false)}>Chat</Link>
            <Link href="/openrouter" className="block py-1 text-sm" onClick={() => setOpen(false)}>Models</Link>
            <Link href="/pricing" className="block py-1 text-sm" onClick={() => setOpen(false)}>Pricing</Link>
            <SignedIn>
              <Link href="/account" className="block py-1 text-sm" onClick={() => setOpen(false)}>Account</Link>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}