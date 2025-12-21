/**
 * GET /api/diagnosis/[id] - Get full diagnosis details with prescription items
 *
 * This endpoint retrieves complete diagnosis information and all associated prescription items
 * for a specific diagnosis ID. Access is controlled based on user role:
 * - Doctors can view any diagnosis
 * - Patients can only view their own diagnoses
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Query: getDiagnosisDetails.sql and getPrescriptionItemsByDiagnosis.sql in sql/queries/
 *   - getPrescriptionItemsByDiagnosis uses the vw_PrescriptionDetails VIEW
 *   - The view joins prescription_item with medications for medication names
 *
 * Database Objects Used:
 * - VIEW: vw_PrescriptionDetails (joins prescription_item with medications)
 *
 * Used by:
 * - DiagnosisDetailDialog component to show full diagnosis and prescriptions
 *
 * Route parameters:
 * - id: Diagnosis ID (number)
 *
 * @returns JSON response with diagnosis details and prescription items
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a user record from the database
 * Used to verify user role and access permissions
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
 * Type definition for diagnosis details
 * Complete diagnosis information from the database
 */
type DiagnosisDetails = {
  diagnosis_id: number;
  doctor_id: string;
  patient_id: string;
  date: Date;
  diagnosis: string;
  next_checkup: Date | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * Type definition for prescription item
 * Represents a single medication prescribed in the diagnosis
 */
type PrescriptionItem = {
  prescription_item_id: number;
  medication_id: number;
  medication_name: string;
  quantity: number;
  guide: string | null;
  duration: string | null;
};

/**
 * GET endpoint - Fetch full diagnosis details with prescription items
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk
 * 2. Verifies user has access to the diagnosis (doctor can see any, patient can see own)
 * 3. Queries database for diagnosis details
 * 4. Queries database for prescription items
 * 5. Returns combined results
 *
 * @param request - Next.js Request object
 * @param params - Route parameters containing diagnosis ID
 * @returns JSON response with diagnosis details and prescription items
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get diagnosis ID from route parameters
    const { id } = await params;
    const diagnosisId = parseInt(id, 10);

    // Validate diagnosis ID
    if (isNaN(diagnosisId) || diagnosisId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid diagnosis ID",
          message: "Diagnosis ID must be a positive integer",
        },
        { status: 400 }
      );
    }

    // Verify user exists in database
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

    // Query database for diagnosis details
    // This will return the diagnosis record with doctor_id and patient_id
    const diagnoses = await executeQuery<DiagnosisDetails>(
      "queries/getDiagnosisDetails.sql",
      [diagnosisId]
    );

    if (diagnoses.length === 0) {
      return NextResponse.json(
        {
          error: "Diagnosis not found",
          message: `No diagnosis found with ID: ${diagnosisId}`,
        },
        { status: 404 }
      );
    }

    const diagnosis = diagnoses[0];

    // Check access permissions
    // Doctors can view any diagnosis, patients can only view their own
    if (user.role !== "Doctor" && diagnosis.patient_id !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to view this diagnosis",
        },
        { status: 403 }
      );
    }

    // Query database for prescription items associated with this diagnosis
    // This query uses the vw_PrescriptionDetails VIEW which:
    // - Joins prescription_item with medications table
    // - Includes medication_name from the medications table
    // The query filters by diagnosis_id to get only items for this diagnosis
    const prescriptionItems = await executeQuery<PrescriptionItem>(
      "queries/getPrescriptionItemsByDiagnosis.sql",
      [diagnosisId]
    );

    // Return diagnosis details with prescription items
    // This structure matches what the frontend expects
    return NextResponse.json({
      success: true,
      data: {
        diagnosis,
        prescriptionItems,
      },
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching diagnosis details:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch diagnosis details",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
