import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/flyer-modal.css';
import '@/styles/chat.css';
import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import type { AppProps } from 'next/app';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function InitUserOnce() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    
    const key = `init:${user.id}`;
    if (localStorage.getItem(key) === 'done') return;

    (async () => {
      try {
        const response = await fetch('/api/user/init', { method: 'POST' });
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok || !data?.ok) {
          console.warn('user/init failed', data);
        } else {
          localStorage.setItem(key, 'done');
        }
      } catch (error) {
        console.warn('user/init error', error);
      }
    })();
  }, [isSignedIn, user?.id]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ClerkProvider {...pageProps}>
        <QueryClientProvider client={queryClient}>
          <InitUserOnce />
          <Component {...pageProps} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
