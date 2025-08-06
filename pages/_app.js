// pages/_app.js
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css"; // Optional if you have custom styles

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
