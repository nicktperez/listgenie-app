import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen p-10">
          <h1 className="text-2xl font-bold">Welcome, {user.firstName} 👋</h1>
          <p className="mt-2 text-gray-700">Let’s generate your first listing!</p>
        </div>
      </SignedIn>
    </>
  );
}
