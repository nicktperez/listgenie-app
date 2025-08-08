import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import NavBar from '@/components/NavBar';

export default function MyApp({ Component, pageProps, router }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ClerkProvider {...pageProps}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={router.route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              <Component {...pageProps} />
            </motion.main>
          </AnimatePresence>
          <Toaster position="top-right" />
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  );
}