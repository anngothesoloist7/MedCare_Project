import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { executeQuery } from "@/utils/sql";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/api/webhooks/clerk",
  "/api/webhooks(.*)",
]);

// Define onboarding route that should be accessible but may need redirect check
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

/**
 * Type definition for a user record from the database
 * Used to check if user has completed onboarding (nid_number is not null)
 */
type User = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: string | null;
  created_at: Date;
  updated_at: Date;
};

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Check if user needs onboarding (only for authenticated routes)
  // This applies to ALL authenticated users, including existing users who signed in before
  // Skip this check for public routes and API routes (except onboarding API)
  if (!isPublicRoute(request) && !request.nextUrl.pathname.startsWith("/api")) {
    try {
      // Get the authenticated user ID from Clerk
      // This works for both new and existing users
      const { userId } = await auth();

      // If user is authenticated, check their onboarding status
      // This check applies to ALL authenticated users, regardless of when they signed up
      if (userId) {
        // Query database to check if user has completed onboarding
        // nid_number is null means user hasn't completed onboarding yet
        // This applies to both new users and existing users who haven't onboarded
        const users = await executeQuery<User>("queries/getUserById.sql", [
          userId,
        ]);

        // Check if user exists in database
        if (users.length > 0) {
          const user = users[0];

          // If user exists but nid_number is null, they need to complete onboarding
          // This applies to ALL users (new and existing) who haven't completed onboarding
          // Redirect them to /onboarding unless they're already there
          if (user.nid_number === null && !isOnboardingRoute(request)) {
            return NextResponse.redirect(new URL("/onboarding", request.url));
          }

          // If user has completed onboarding but tries to access /onboarding,
          // redirect them to home page
          if (user.nid_number !== null && isOnboardingRoute(request)) {
            return NextResponse.redirect(new URL("/", request.url));
          }
        }
        // Note: If user doesn't exist in database yet (webhook hasn't fired),
        // we skip the redirect check. The webhook should create the user record
        // immediately on signup, and on their next request, this check will run.
      }
    } catch (error) {
      // If there's an error checking user status (e.g., database connection issue),
      // log it but don't block the request - let the route handle it
      console.error("Error checking onboarding status:", error);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
