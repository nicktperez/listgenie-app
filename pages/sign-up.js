// pages/sign-up.js
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="container auth-page">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </main>
  );
}