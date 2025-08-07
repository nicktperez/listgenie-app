// components/NavBar.js
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Brand & Links */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">
            ListGenie
          </Link>
          <SignedIn>
            <Link
              href="/chat"
              className="text-sm text-gray-700 hover:text-black"
            >
              Chat
            </Link>
            <Link
              href="/openrouter"
              className="text-sm text-gray-700 hover:text-black"
            >
              Models
            </Link>
            <Link
              href="/usage"
              className="text-sm text-gray-700 hover:text-black"
            >
              Usage
            </Link>
          </SignedIn>
        </div>

        {/* Right side - Auth */}
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}