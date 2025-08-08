// pages/sign-in.js
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="container auth-page">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}