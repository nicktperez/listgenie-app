// pages/_app.js
import "@/styles/globals.css";
import "@/styles/chat.css";
import "@/styles/flyer-modal.css";
import "@/styles/components.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


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
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ClerkProvider {...pageProps}>
      <QueryClientProvider client={queryClient}>
        <InitUserOnce />

        <Component {...pageProps} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
