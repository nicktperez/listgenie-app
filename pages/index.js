import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-10 text-center">
      <div>
        <h1 className="text-4xl font-bold mb-4">Welcome to ListGenie.ai</h1>
        <SignedOut><SignInButton /></SignedOut>
        <SignedIn><UserButton /></SignedIn>
      </div>
    </div>
  );
}
