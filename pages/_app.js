import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import NavBar from "../components/NavBar";

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <NavBar />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
