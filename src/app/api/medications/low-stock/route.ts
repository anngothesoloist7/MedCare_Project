/**
 * GET /api/medications/low-stock - Get 5 medications with lowest stock
 *
 * This endpoint retrieves the 5 medications with the lowest stock quantities.
 * Only accessible to doctors.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Low stock query: getLowest5StockedMedications.sql in sql/queries/
 *
 * Used by:
 * - Medication tracking page to display low stock warning table
 *
 * @returns JSON response with array of lowest stocked medications or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a low stock medication record from the database
 * Matches the structure returned from getLowest5StockedMedications.sql query
 */
type LowStockMedication = {
  medication_id: number;
  name: string;
  stock_quantity: number;
  unit_price: number;
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
 * GET endpoint - Fetch 5 medications with lowest stock
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk
 * 2. Verifies user is a doctor
 * 3. Queries the database for medications ordered by stock quantity ASC
 * 4. Returns the 5 medications with lowest stock
 *
 * @returns JSON response with lowest stocked medications data or error message
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

    // Query database for lowest 5 stocked medications using getLowest5StockedMedications.sql
    // This query orders medications by stock_quantity ASC and limits to 5
    const lowStockMedications = await executeQuery<LowStockMedication>(
      "queries/getLowest5StockedMedications.sql"
    );

    // Return low stock medications array
    return NextResponse.json({
      success: true,
      data: lowStockMedications,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching low stock medications:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch low stock medications",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
