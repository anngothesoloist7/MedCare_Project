/**
 * POST /api/diagnosis - Create diagnosis and prescription items
 *
 * This endpoint creates a new diagnosis record and associated prescription items.
 * It validates that the user is a doctor, generates unique IDs, and handles the
 * transaction to ensure data consistency.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery and executeProcedure utilities (src/utils/sql.ts)
 * - Diagnosis procedure: sp_AddDiagnosis.sql in sql/procedures/
 * - Prescription procedure: sp_AddPrescriptionItem.sql in sql/procedures/
 * - User lookup query: getUserById.sql in sql/queries/
 *
 * Used by:
 * - Diagnosis page to submit diagnosis and prescription forms
 *
 * Request body:
 * {
 *   patientId: string,
 *   diagnosis: string,
 *   nextCheckup?: string (YYYY-MM-DD format),
 *   prescriptionItems: Array<{
 *     medicationId: string,
 *     quantity: number,
 *     guide?: string,
 *     duration?: string
 *   }>
 * }
 *
 * @returns JSON response with success status or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";
import { getConnection } from "@/utils/db";

/**
 * Type definition for user record from database
 * Used to verify user role before allowing diagnosis creation
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
 * Type definition for prescription item in request body
 */
type PrescriptionItemRequest = {
  medicationId: string;
  quantity: number;
  guide?: string;
  duration?: string;
};

/**
 * Type definition for diagnosis request body
 */
type DiagnosisRequest = {
  patientId: string;
  diagnosis: string;
  nextCheckup?: string; // YYYY-MM-DD format
  prescriptionItems: PrescriptionItemRequest[];
};

/**
 * Generates a unique ID for diagnosis or prescription item
 * Uses crypto.randomUUID() for UUID v4 generation
 *
 * @returns UUID string
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * POST endpoint - Create diagnosis and prescription items
 *
 * This endpoint:
 * 1. Verifies user is authenticated and has role='Doctor'
 * 2. Validates request body (patientId, diagnosis are required)
 * 3. Generates unique IDs for diagnosis and prescription items
 * 4. Creates diagnosis record via stored procedure
 * 5. Creates each prescription item via stored procedure (handles stock updates)
 * 6. Returns success response or error
 *
 * The prescription procedure (sp_AddPrescriptionItem) handles:
 * - Stock validation (ensures quantity <= stock_quantity)
 * - Stock decrement (updates medication stock_quantity)
 * - Transaction rollback on errors
 *
 * @param request - Next.js Request object containing JSON body with diagnosis data
 * @returns JSON response with success status or error message
 */
export async function POST(request: Request) {
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
    // Only doctors can create diagnoses
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
          message: "Only doctors can create diagnoses",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: DiagnosisRequest = await request.json();
    const { patientId, diagnosis, nextCheckup, prescriptionItems } = body;

    // Validate required fields
    if (!patientId || !diagnosis) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "patientId and diagnosis are required",
        },
        { status: 400 }
      );
    }

    // Validate diagnosis is not empty string
    if (diagnosis.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Invalid diagnosis",
          message: "Diagnosis cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate prescription items array exists (can be empty array)
    if (!Array.isArray(prescriptionItems)) {
      return NextResponse.json(
        {
          error: "Invalid prescription items",
          message: "prescriptionItems must be an array",
        },
        { status: 400 }
      );
    }

    // Validate each prescription item
    for (const item of prescriptionItems) {
      if (!item.medicationId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            error: "Invalid prescription item",
            message:
              "Each prescription item must have medicationId and quantity > 0",
          },
          { status: 400 }
        );
      }
    }

    // Note: Both diagnosis_id and prescription_item_id are AUTO_INCREMENT in the database
    // MySQL will generate them automatically, so we don't need to generate IDs

    // Get database connection for transaction
    // We'll use manual transaction handling to ensure all operations succeed or fail together
    const connection = await getConnection();

    try {
      // Start transaction
      // This ensures that if any operation fails, all changes are rolled back
      await connection.beginTransaction();

      // Create diagnosis record using stored procedure
      // sp_AddDiagnosis handles: patient_id, doctor_id, diagnosis, date (NOW()), next_checkup
      // diagnosis_id is AUTO_INCREMENT, so MySQL will generate it automatically
      // Stored procedures are called using CALL statement
      await connection.execute("CALL sp_AddDiagnosis(?, ?, ?, ?)", [
        patientId,
        userId, // doctor_id is the current authenticated user
        diagnosis,
        nextCheckup ?? null, // Convert undefined to null for optional field
      ]);

      // Get the generated diagnosis_id using LAST_INSERT_ID()
      // This function returns the AUTO_INCREMENT value from the last INSERT statement
      const [lastIdResult] = await connection.execute(
        "SELECT LAST_INSERT_ID() as insert_id"
      );
      const finalDiagnosisId =
        (lastIdResult as { insert_id: number }[])[0]?.insert_id ?? 0;

      if (finalDiagnosisId === 0) {
        throw new Error("Failed to get generated diagnosis_id");
      }

      // Create each prescription item using stored procedure
      // sp_AddPrescriptionItem handles: stock validation, stock decrement, transaction safety
      // Note: Transaction is managed by the route handler, not the stored procedure
      // This avoids nested transaction conflicts
      // prescription_item_id is AUTO_INCREMENT, so MySQL will generate it automatically
      for (let i = 0; i < prescriptionItems.length; i++) {
        const item = prescriptionItems[i];

        // Debug logging to help identify issues
        console.log(
          `[DEBUG] Creating prescription item ${i + 1}/${
            prescriptionItems.length
          }:`,
          {
            diagnosisId: finalDiagnosisId.toString(),
            medicationId: item.medicationId,
            quantity: item.quantity,
            guide: item.guide ?? null,
            duration: item.duration ?? null,
            doctorId: userId,
          }
        );

        // Call stored procedure for each prescription item
        // The procedure validates stock, decrements quantity, and handles errors
        // Parameters: diagnosis_id, medication_id, quantity, guide, duration, doctor_id
        // Note: prescription_item_id is AUTO_INCREMENT, so it's not passed as a parameter
        await connection.execute(
          "CALL sp_AddPrescriptionItem(?, ?, ?, ?, ?, ?)",
          [
            finalDiagnosisId.toString(), // Convert to string for VARCHAR column
            item.medicationId,
            item.quantity,
            item.guide ?? null, // Convert undefined to null for optional fields
            item.duration ?? null,
            userId, // doctor_id for audit context
          ]
        );

        console.log(`[DEBUG] Successfully created prescription item ${i + 1}`);
      }

      // Commit transaction if all operations succeeded
      await connection.commit();

      // Return success response
      // Note: prescription_item_id values are auto-generated by MySQL, so we don't return them
      return NextResponse.json({
        success: true,
        message: "Diagnosis and prescription items created successfully",
        data: {
          diagnosisId: finalDiagnosisId,
        },
      });
    } catch (error) {
      // Rollback transaction on any error
      // This ensures database consistency if any operation fails
      await connection.rollback();

      // Enhanced error logging for debugging
      console.error("[DEBUG] Transaction error details:", {
        error: error instanceof Error ? error.message : String(error),
        errorCode: (error as { code?: string })?.code,
        errno: (error as { errno?: number })?.errno,
        sqlState: (error as { sqlState?: string })?.sqlState,
        sqlMessage: (error as { sqlMessage?: string })?.sqlMessage,
        sql: (error as { sql?: string })?.sql,
      });

      // Re-throw error to be handled by outer catch block
      throw error;
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    // Log the error for debugging with full details
    console.error("[ERROR] Error creating diagnosis:", error);

    // Extract detailed error information for better debugging
    const errorDetails = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: (error as { code?: string })?.code,
      errno: (error as { errno?: number })?.errno,
      sqlState: (error as { sqlState?: string })?.sqlState,
      sqlMessage: (error as { sqlMessage?: string })?.sqlMessage,
    };

    // Return error response with detailed information
    // This handles validation errors, database errors, stored procedure errors, etc.
    return NextResponse.json(
      {
        error: "Failed to create diagnosis",
        message: errorDetails.message,
        details: errorDetails, // Include detailed error info for debugging
      },
      { status: 500 }
    );
  }
}
