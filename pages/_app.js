// pages/_app.js
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <div className="min-h-screen text-white bg-[#0e1116] bg-[radial-gradient(1000px_500px_at_50%_-100px,rgba(56,189,248,0.18),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(59,130,246,0.12),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(16,185,129,0.10),transparent)]">
        <NavBar />
        <main className="pb-16">
          <Component {...pageProps} />
        </main>
      </div>
    </ClerkProvider>
  );
}