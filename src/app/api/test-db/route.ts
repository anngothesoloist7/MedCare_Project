/**
 * Test API route for database connection
 *
 * This route provides endpoints to test the connection between Next.js and
 * the Railway MySQL database. It includes:
 * - POST /api/test-db: Insert a new medication into the database
 * - GET /api/test-db: Fetch all medications from the database
 *
 * This route uses the SQL execution utilities from src/utils/sql.ts which
 * reads SQL files from the /sql directory and executes them using the
 * connection pool from src/utils/db.ts
 */

import { NextResponse } from "next/server";
import { executeMutation } from "@/utils/sql";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a medication record
 * This matches the structure returned from the database queries
 */
type Medication = {
  medication_id: number;
  name: string;
  description: string | null;
  stock_quantity: number;
  unit_price: number;
  created_at: Date;
};

/**
 * POST endpoint - Insert a new medication into the database
 *
 * This endpoint tests the write operation (INSERT) to verify that the
 * database connection is working correctly. It accepts medication data
 * in the request body and inserts it into the medications table.
 *
 * @param request - Next.js Request object containing JSON body with medication data
 * @returns JSON response with success status and the inserted medication ID
 */
export async function POST(request: Request) {
  try {
    // Parse the request body to get medication data
    // The body should contain: name, description, stockQuantity, unitPrice
    const body = await request.json();
    const { name, description, stockQuantity, unitPrice } = body;

    // Validate required fields
    if (!name || stockQuantity === undefined || unitPrice === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide name, stockQuantity, and unitPrice",
        },
        { status: 400 }
      );
    }

    // Execute the INSERT mutation using the SQL file from sql/mutations/insertMedication.sql
    // The executeMutation function reads the SQL file, prepares the statement with parameters,
    // and executes it using the connection pool from db.ts
    const result = await executeMutation("mutations/insertMedication.sql", [
      name,
      description ?? null,
      stockQuantity,
      unitPrice,
    ]);

    // Return success response with the inserted medication ID
    // The insertId field contains the auto-generated medication_id from the database
    return NextResponse.json({
      success: true,
      message: "Medication inserted successfully",
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Database mutation error:", error);

    // Return error response with details
    // This helps identify connection issues, SQL syntax errors, or constraint violations
    return NextResponse.json(
      {
        error: "Failed to insert medication",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Fetch all medications from the database
 *
 * This endpoint tests the read operation (SELECT) to verify that the
 * database connection is working correctly and that data can be retrieved.
 *
 * @returns JSON response with success status and array of all medications
 */
export async function GET() {
  try {
    // Execute the SELECT query using the SQL file from sql/queries/getAllMedications.sql
    // The executeQuery function reads the SQL file and executes it using the connection pool
    const medications = await executeQuery<Medication>(
      "queries/getAllMedications.sql"
    );

    // Return success response with the medications array
    // This confirms that the database connection is working and data can be retrieved
    return NextResponse.json({
      success: true,
      message: "Medications retrieved successfully",
      count: medications.length,
      data: medications,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Database query error:", error);

    // Return error response with details
    // This helps identify connection issues or SQL syntax errors
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
