// middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Apply Clerk middleware to all pages and API routes so getAuth(req) works.
 * This does NOT force auth; it just makes auth info available.
 * We mark the Stripe webhook as public.
 */
export default clerkMiddleware({
  publicRoutes: [
    "/",                 // landing
    "/upgrade",          // upgrade page (still gates actions server-side)
    "/api/stripe/webhook"
  ],
});

// Make sure it matches /api/* and all pages, but skips static assets and _next
export const config = {
  matcher: [
    // skip Next.js internals and static files
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    // include all API routes
    "/(api|trpc)(.*)",
  ],
};