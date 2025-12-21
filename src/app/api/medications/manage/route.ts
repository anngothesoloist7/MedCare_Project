/**
 * POST /api/medications/manage - Create or update medication
 *
 * This endpoint creates a new medication or updates an existing one.
 * Only accessible to doctors.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeMutation utility (src/utils/sql.ts)
 * - Create mutation: createMedication.sql in sql/mutations/
 * - Update mutation: updateMedicationStock.sql in sql/mutations/
 * - User lookup query: getUserById.sql in sql/queries/
 *
 * Used by:
 * - Medication page to create new medications or update existing ones
 *
 * Request body:
 * {
 *   medicationId?: number,  // Required for updates, not used for creates (auto-increment)
 *   name?: string,  // Required for creates, not used for updates
 *   description?: string,  // Optional for creates, not used for updates
 *   stockQuantity: number,
 *   unitPrice: number,
 *   isUpdate: boolean  // true for update, false for create
 * }
 *
 * @returns JSON response with success status or error message
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeMutation, executeQuery } from "@/utils/sql";

/**
 * Type definition for medication form data in request body
 */
type MedicationFormData = {
  medicationId?: number;
  name?: string;
  description?: string;
  stockQuantity: number;
  unitPrice: number;
  isUpdate: boolean;
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
 * POST endpoint - Create or update medication
 *
 * This endpoint:
 * 1. Verifies user is authenticated and has role='Doctor'
 * 2. Validates request body
 * 3. If creating: executes createMedication.sql (medication_id is auto-generated)
 * 4. If updating: executes updateMedicationStock.sql with medication_id (only updates stock_quantity and unit_price)
 * 5. Returns success response or error
 *
 * @param request - Next.js Request object containing JSON body with medication data
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
    // Only doctors can manage medications
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
          message: "Only doctors can manage medications",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: MedicationFormData = await request.json();
    const {
      medicationId,
      name,
      description,
      stockQuantity,
      unitPrice,
      isUpdate,
    } = body;

    // Validate required fields based on create vs update mode
    if (isUpdate) {
      // For updates, only stockQuantity and unitPrice are required
      if (stockQuantity === undefined || unitPrice === undefined) {
        return NextResponse.json(
          {
            error: "Missing required fields",
            message: "Please provide stockQuantity and unitPrice",
          },
          { status: 400 }
        );
      }
    } else {
      // For creates, name, stockQuantity, and unitPrice are required
      if (!name || stockQuantity === undefined || unitPrice === undefined) {
        return NextResponse.json(
          {
            error: "Missing required fields",
            message: "Please provide name, stockQuantity, and unitPrice",
          },
          { status: 400 }
        );
      }
    }

    // Validate stockQuantity is non-negative
    if (stockQuantity < 0) {
      return NextResponse.json(
        {
          error: "Invalid stock quantity",
          message: "Stock quantity must be non-negative",
        },
        { status: 400 }
      );
    }

    // Validate unitPrice is non-negative
    if (unitPrice < 0) {
      return NextResponse.json(
        {
          error: "Invalid unit price",
          message: "Unit price must be non-negative",
        },
        { status: 400 }
      );
    }

    // Handle create or update based on isUpdate flag
    if (isUpdate) {
      // Update existing medication
      // medicationId is required for updates and must be a number
      if (!medicationId || typeof medicationId !== "number") {
        return NextResponse.json(
          {
            error: "Missing medication ID",
            message: "medicationId (number) is required for updates",
          },
          { status: 400 }
        );
      }

      // Execute update mutation
      // Parameters: stock_quantity, unit_price, medication_id
      // Only updates stock_quantity and unit_price (name and description are not updated)
      const result = await executeMutation(
        "mutations/updateMedicationStock.sql",
        [stockQuantity, unitPrice, medicationId]
      );

      return NextResponse.json({
        success: true,
        message: "Medication updated successfully",
        affectedRows: result.affectedRows,
      });
    } else {
      // Create new medication
      // medication_id is auto-generated by the database (auto-increment INT)
      // Parameters: name, description, stock_quantity, unit_price
      const result = await executeMutation("mutations/createMedication.sql", [
        name,
        description ?? null,
        stockQuantity,
        unitPrice,
      ]);

      return NextResponse.json({
        success: true,
        message: "Medication created successfully",
        medicationId: result.insertId,
        insertId: result.insertId,
        affectedRows: result.affectedRows,
      });
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Error managing medication:", error);

    // Return error response
    // This handles database connection errors, query errors, constraint violations, etc.
    return NextResponse.json(
      {
        error: "Failed to manage medication",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
