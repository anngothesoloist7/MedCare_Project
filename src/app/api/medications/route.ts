/**
 * GET /api/medications - Get all medications with current stock quantities
 *
 * This endpoint retrieves all medications from the database.
 * Used by doctors when selecting medications for prescriptions.
 *
 * Connected to:
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Medications query: getAllMedications.sql in sql/queries/
 *
 * Used by:
 * - Diagnosis page to populate medication selection dropdown/search
 *
 * @returns JSON response with array of medications or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a medication record from the database
 * Matches the structure returned from getAllMedications.sql query
 */
type Medication = {
  medication_id: string;
  name: string;
  description: string | null;
  stock_quantity: number;
  unit_price: number; // DECIMAL(10,2) from MySQL
  created_at: Date;
  updated_at: Date;
};

/**
 * GET endpoint - Fetch all medications
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk (for authorization)
 * 2. Queries the database for all medications
 * 3. Returns the medications array sorted by name
 *
 * Optional query parameters:
 * - search: Filter medications by name (case-insensitive partial match)
 *
 * @returns JSON response with medications array or error message
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated user ID from Clerk
    // Only authenticated users can view medications
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

    // Extract optional search parameter from query string
    // URL format: /api/medications?search=aspirin
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search");

    // Query database for medications using getAllMedications.sql
    let medications = await executeQuery<Medication>(
      "queries/getAllMedications.sql"
    );

    // If search term is provided, filter medications by name (case-insensitive)
    // This filtering is done in-memory after query for simplicity
    // For large datasets, consider adding WHERE clause to SQL query instead
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      medications = medications.filter((med) =>
        med.name.toLowerCase().includes(searchLower)
      );
    }

    // Return medications array
    return NextResponse.json({
      success: true,
      data: medications,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching medications:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch medications",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
