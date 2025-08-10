// middleware.js
import { authMiddleware } from "@clerk/nextjs";

// Public pages & APIs that should NOT require auth for viewing.
// (We still read auth if present so getAuth works.)
export default authMiddleware({
  publicRoutes: [
    "/",                // landing
    "/chat",
    "/listings",
    "/admin",           // the UI is protected by token in headers
    "/api/user/plan",
    "/api/user/init",   // we call this right after sign-in; it's fine public
    "/api/chat/(.*)",   // chat endpoints handle auth internally
    "/api/listings/(.*)",
    "/api/stripe/(.*)",
    "/api/admin/(.*)",  // server checks X-Admin-Token
  ],
  // Webhooks or binary endpoints that must not be wrapped by Clerk
  ignoredRoutes: ["/api/stripe/webhook"],
});

// Run on everything except Next internals & static files
export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};