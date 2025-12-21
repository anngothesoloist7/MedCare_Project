/**
 * GET /api/medications/top-5 - Get top 5 medications by prescription usage
 *
 * This endpoint retrieves the top 5 medications based on prescription usage count.
 * Only accessible to doctors.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Top medications query: getTop5Medications.sql in sql/queries/
 *
 * Used by:
 * - Medication tracking page to display bar chart of top medications
 *
 * @returns JSON response with array of top 5 medications or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a top medication record from the database
 * Matches the structure returned from getTop5Medications.sql query
 */
type TopMedication = {
  medication_id: number;
  name: string;
  usage_count: number;
};

/**
 * Type definition for user record from database
 * Used to verify user role before allowing access
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

/**
 * GET endpoint - Fetch top 5 medications by usage count
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk
 * 2. Verifies user is a doctor
 * 3. Queries the database for top 5 medications by prescription usage
 * 4. Returns the medications array
 *
 * @returns JSON response with top 5 medications data or error message
 */
export async function GET() {
  try {
    // Get the authenticated user ID from Clerk
    // auth() throws an error if user is not authenticated
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

    // Verify user is a doctor by querying database
    // Only doctors can access medication tracking
    const users = await executeQuery<User>("queries/getUserById.sql", [userId]);

    if (users.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User record not found in database",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Check if user has Doctor role
    if (user.role !== "Doctor") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can access medication tracking",
        },
        { status: 403 }
      );
    }

    // Query database for top 5 medications using getTop5Medications.sql
    // This query joins medications with prescription_item and counts usage
    const topMedications = await executeQuery<TopMedication>(
      "queries/getTop5Medications.sql"
    );

    // Return top medications array
    return NextResponse.json({
      success: true,
      data: topMedications,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching top medications:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch top medications",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
