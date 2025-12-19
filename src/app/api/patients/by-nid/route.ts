/**
 * GET /api/patients/by-nid - Get patient information by NID number
 *
 * This endpoint retrieves patient information by looking up their national ID number.
 * It joins the users and patients tables to return complete patient details.
 *
 * Connected to:
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Patient lookup query: getPatientByNid.sql in sql/queries/
 *
 * Used by:
 * - Diagnosis page to look up patient information when doctor enters NID number
 *
 * @returns JSON response with patient data or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a patient record from the database
 * Matches the structure returned from getPatientByNid.sql query
 */
type Patient = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  dob: string | null; // Date as string from MySQL DATE type
  role: "Admin" | "Doctor" | "Patient" | null;
  age: number;
  height: number; // Decimal(3,2) from MySQL
  gender: "male" | "female" | "other";
};

/**
 * GET endpoint - Fetch patient by NID number
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk (for authorization)
 * 2. Extracts nid_number from query parameters
 * 3. Queries the database for the patient record
 * 4. Returns the patient data or 404 if not found
 *
 * Query parameters:
 * - nid_number: The national ID number to look up (required)
 *
 * @returns JSON response with patient data or error message
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated user ID from Clerk
    // Only authenticated users can look up patients
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

    // Extract nid_number from query parameters
    // URL format: /api/patients/by-nid?nid_number=123456789
    const { searchParams } = new URL(request.url);
    const nidNumber = searchParams.get("nid_number");

    // Validate that nid_number parameter is provided
    if (!nidNumber) {
      return NextResponse.json(
        {
          error: "Missing parameter",
          message: "nid_number query parameter is required",
        },
        { status: 400 }
      );
    }

    // Query database for patient record using getPatientByNid.sql
    // This query joins users and patients tables and filters by nid_number and role='Patient'
    const patients = await executeQuery<Patient>(
      "queries/getPatientByNid.sql",
      [nidNumber]
    );

    // Check if patient was found
    if (patients.length === 0) {
      return NextResponse.json(
        {
          error: "Patient not found",
          message: `No patient found with NID number: ${nidNumber}`,
        },
        { status: 404 }
      );
    }

    const patient = patients[0];

    // Return patient data
    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching patient by NID:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch patient",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
