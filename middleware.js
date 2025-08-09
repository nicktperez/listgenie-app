// middleware.js (root, same level as /pages)
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/upgrade", "/api/stripe/webhook"], // webhook must be public
});

export const config = {
  matcher: [
    // match all routes except static files and _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    // include all API routes
    "/(api|trpc)(.*)",
  ],
};