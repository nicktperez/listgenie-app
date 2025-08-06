import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import NavBar from "../components/NavBar";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      <NavBar />
      <main className="max-w-3xl mx-auto mt-10 p-6">
        <SignedIn>
          <h1 className="text-3xl font-bold mb-4">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-gray-700 mb-6">
            Use the form below to generate stunning listing descriptions,
            emails, and posts in seconds.
          </p>
          {/* We’ll add the generation form here next */}
        </SignedIn>
        <SignedOut>
          <p>Please sign in to access your dashboard.</p>
        </SignedOut>
      </main>
    </div>
  );
}
