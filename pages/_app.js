// pages/_app.js
import "@/styles/globals.css";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import NavBar from "@/components/NavBar";

function InitUser() {
  const { isSignedIn, getToken } = useAuth();
  const did = useRef(false);

  useEffect(() => {
    if (!isSignedIn || did.current) return;
    did.current = true;
    // Fire and forget; we don't block the UI
    fetch("/api/user/init", { method: "POST" }).catch(() => {});
  }, [isSignedIn]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <InitUser />
      <NavBar />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}