// pages/_app.js
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import NavBar from "@/components/NavBar";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {/* Global Nav */}
        <NavBar />

        {/* Page Content */}
        <Component {...pageProps} />

        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}