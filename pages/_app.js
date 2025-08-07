// pages/_app.js
import '../styles/globals.css';
import { ClerkProvider, useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

function InitUser() {
  const { isSignedIn, user } = useUser();
  const ranOnceRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    if (ranOnceRef.current) return;       // avoid duplicate calls
    ranOnceRef.current = true;

    // Fire-and-forget: server will create/ensure row in `public.users`
    fetch('/api/user/init', { method: 'POST' }).catch(() => {
      // non-blocking
    });
  }, [isSignedIn, user]);

  return null;
}

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <InitUser />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}