/**
 * GET /api/users/me - Get current authenticated user data
 *
 * This endpoint retrieves the current authenticated user's data from the database.
 * It uses Clerk's auth() to get the authenticated user ID, then queries the database
 * to fetch the user record including onboarding status (nid_number, role, phone, dob).
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Users table query: getUserById.sql in sql/queries/
 *
 * Used by:
 * - Onboarding page to display user name and check if onboarding is complete
 * - Middleware to check onboarding status (though middleware queries directly)
 *
 * @returns JSON response with user data or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a user record from the database
 * Matches the structure returned from getUserById.sql query
 */
type User = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: string | null; // Date as string from MySQL DATE type
  created_at: Date;
  updated_at: Date;
};

/**
 * GET endpoint - Fetch current authenticated user from database
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk
 * 2. Queries the database for the user record
 * 3. Returns the user data including onboarding status
 *
 * @returns JSON response with user data or error message
 */
export async function GET() {
  try {
    // Get the authenticated user ID from Clerk
    // auth() throws an error if user is not authenticated, but middleware should protect this route
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User is not authenticated",
        },
        { status: 401 }
      );
    }

    // Query database for user record using getUserById.sql
    // This query returns user data including nid_number, phone, role, dob
    const users = await executeQuery<User>("queries/getUserById.sql", [userId]);

    if (users.length === 0) {
      // User doesn't exist in database yet (shouldn't happen if webhook is working)
      return NextResponse.json(
        {
          error: "User not found",
          message: "User record not found in database",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Return user data
    // This includes onboarding status (nid_number === null means onboarding incomplete)
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching current user:", error);

    // Return error response
    // This handles Clerk auth errors, database connection errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
