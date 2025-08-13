// pages/_app.js
import "@/styles/globals.css";
import "@/styles/chat.css";
import "@/styles/flyer-modal.css";
import "@/styles/components.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import NavBar from "@/components/NavBar";

function InitUserOnce() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    const key = `init:${user.id}`;
    if (localStorage.getItem(key) === "done") return;

    (async () => {
      try {
        const r = await fetch("/api/user/init", { method: "POST" });
        // Read response for debugging
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) {
          console.warn("user/init failed", j);
        } else {
          localStorage.setItem(key, "done");
        }
      } catch (e) {
        console.warn("user/init error", e);
      }
    })();
  }, [isSignedIn, user?.id]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <InitUserOnce />
      <NavBar />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}