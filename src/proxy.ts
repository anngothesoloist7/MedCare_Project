// Clerk middleware configuration for Next.js App Router
// This file handles authentication middleware using clerkMiddleware() from @clerk/nextjs/server
// The middleware runs on all routes except static files and Next.js internals
import { clerkMiddleware } from "@clerk/nextjs/server";

// Export the clerkMiddleware as the default export
// This middleware will handle authentication checks and user session management
export default clerkMiddleware();

// Configuration for which routes the middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // This regex excludes _next routes and static file extensions
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (including tRPC routes)
    "/(api|trpc)(.*)",
  ],
};
