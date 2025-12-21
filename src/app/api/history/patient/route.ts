/**
 * GET /api/history/patient - Get patient diagnosis history with pagination (for doctors)
 *
 * This endpoint allows doctors to query a specific patient's diagnosis history.
 * It returns diagnoses ordered by most recent first, with pagination support.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts)
 * - Query: getPatientDiagnosisHistory.sql and getPatientDiagnosisHistoryCount.sql in sql/queries/
 *
 * Used by:
 * - HistoryQueryDialog component for doctors to search patient history
 *
 * Query parameters:
 * - patientId: Patient's user_id (Clerk ID) - required
 * - page: Page number (default: 1)
 * - limit: Number of records per page (default: 5)
 *
 * @returns JSON response with paginated patient diagnosis history
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery, executeRaw } from "@/utils/sql";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Type definition for a user record from the database
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
 * Type definition for a diagnosis history record
 * Represents a single diagnosis for the patient
 */
type DiagnosisHistory = {
  diagnosis_id: number;
  doctor_id: string;
  date: Date;
  diagnosis: string;
  next_checkup: Date | null;
};

/**
 * Type definition for count query result
 */
type CountResult = {
  total: number;
};

/**
 * GET endpoint - Fetch patient diagnosis history with pagination
 *
 * This endpoint:
 * 1. Gets the authenticated user ID from Clerk
 * 2. Verifies user has Doctor role
 * 3. Extracts patientId and pagination parameters from query string
 * 4. Queries database for patient diagnosis history with pagination
 * 5. Returns paginated results with metadata
 *
 * @param request - Next.js Request object containing query parameters
 * @returns JSON response with paginated patient diagnosis history
 */
export async function GET(request: Request) {
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
    // Only doctors can access this endpoint
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
          message: "Only doctors can access this endpoint",
        },
        { status: 403 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "5", 10);

    // Validate required parameter
    if (!patientId) {
      return NextResponse.json(
        {
          error: "Missing parameter",
          message: "patientId query parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          message: "Page and limit must be positive integers",
        },
        { status: 400 }
      );
    }

    // Calculate offset for pagination
    // offset = (page - 1) * limit
    // Ensure limit and offset are explicitly integers
    const offset = (page - 1) * limit;
    const limitInt = parseInt(limit.toString(), 10);
    const offsetInt = parseInt(offset.toString(), 10);

    // MySQL prepared statements don't support placeholders for LIMIT/OFFSET
    // So we need to safely interpolate the validated integer values
    // Read SQL file and replace LIMIT placeholders with actual values
    const sqlPath = join(process.cwd(), "sql", "queries", "getPatientDiagnosisHistory.sql");
    let sql = await readFile(sqlPath, "utf-8");
    sql = sql.trim();
    
    // Replace LIMIT ?, ? with actual values (safe because we validated them as integers)
    sql = sql.replace(/LIMIT \?, \?/i, `LIMIT ${offsetInt}, ${limitInt}`);

    // Execute query with only the WHERE clause parameter (patient_id)
    const history = await executeRaw<DiagnosisHistory>(sql, [patientId]);

    // Get total count for pagination metadata
    // This allows frontend to calculate total pages
    const countResults = await executeQuery<CountResult>(
      "queries/getPatientDiagnosisHistoryCount.sql",
      [patientId]
    );

    const total = countResults[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Return paginated results with metadata
    // This structure matches what the frontend expects for pagination
    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching patient diagnosis history:", error);

    // Return error response
    // This handles database connection errors, query errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch patient diagnosis history",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

