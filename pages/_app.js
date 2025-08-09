// pages/_app.js
import "@/styles/globals.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import "@/styles/chat.css"; // load chat styles globally

function InitUserOnce() {
  const { isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const key = `lg_user_inited_${user.id}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) return;

    (async () => {
      try {
        await fetch("/api/user/init", { method: "POST" });
        localStorage.setItem(key, "1");
      } catch (err) {
        console.error("Init user failed", err);
      }
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <InitUserOnce />
      <div className="min-h-screen text-white bg-[#0e1116]">
        <NavBar />
        <main className="pb-16">
          <Component {...pageProps} />
        </main>
      </div>
    </ClerkProvider>
  );
}