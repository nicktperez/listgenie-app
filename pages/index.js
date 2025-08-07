// pages/index.js
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ListGenie</h1>
        <div>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      <SignedOut>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Welcome!</h2>
          <p>Please sign in to access your tools.</p>
          <Link
            href="/sign-in"
            className="inline-block bg-black text-white px-4 py-2 rounded"
          >
            Sign In
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Hey {user?.firstName || user?.username || "there"} 👋</h2>
          <p className="text-gray-600">Pick a tool to get started:</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/chat" className="block border rounded-lg p-5 hover:bg-gray-50">
            <h3 className="font-semibold mb-1">Chat</h3>
            <p className="text-sm text-gray-600">Ask ListGenie questions and draft listing content.</p>
          </Link>

          <Link href="/openrouter" className="block border rounded-lg p-5 hover:bg-gray-50">
            <h3 className="font-semibold mb-1">Models</h3>
            <p className="text-sm text-gray-600">Browse available OpenRouter models.</p>
          </Link>

          <Link href="/usage" className="block border rounded-lg p-5 hover:bg-gray-50">
            <h3 className="font-semibold mb-1">Usage</h3>
            <p className="text-sm text-gray-600">See your request/token usage (admins can see all).</p>
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}