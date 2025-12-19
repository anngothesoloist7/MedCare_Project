/**
 * Users API route
 *
 * This route provides endpoints to manage users in the database.
 * It includes:
 * - POST /api/users: Create a new user
 * - GET /api/users: Fetch all users
 * - PATCH /api/users: Update user fields (nid_number, phone, role, dob)
 *
 * This route uses the SQL execution utilities from src/utils/sql.ts which
 * reads SQL files from the /sql directory and executes them using the
 * connection pool from src/utils/db.ts
 */

import { NextResponse } from "next/server";
import { executeMutation } from "@/utils/sql";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for a user record
 * This matches the structure returned from the database queries
 * nid_number, phone, role, and dob are optional fields that will be updated during onboarding
 */
type User = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: string | null; // Date as string from MySQL DATE type (optional)
  created_at: Date;
  updated_at: Date;
};

/**
 * POST endpoint - Insert a new user into the database
 *
 * This endpoint creates a new user record. It accepts user data
 * in the request body and inserts it into the users table.
 *
 * @param request - Next.js Request object containing JSON body with user data
 * @returns JSON response with success status and the inserted user ID
 */
export async function POST(request: Request) {
  try {
    // Parse the request body to get user data
    // The body should contain: userId (required)
    // Optional fields: nidNumber, phone, role, dob (will be updated during onboarding)
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    // Only userId is required for initial user creation
    // nid_number, phone, role, and dob are optional and will be updated during onboarding
    if (!userId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide userId",
        },
        { status: 400 }
      );
    }

    // Execute the INSERT mutation using the SQL file from sql/mutations/insertUser.sql
    // The executeMutation function reads the SQL file, prepares the statement with parameters,
    // and executes it using the connection pool from db.ts
    // Only user_id is inserted - optional fields will be updated later during onboarding
    const result = await executeMutation("mutations/insertUser.sql", [userId]);

    // Return success response with the inserted user ID
    // The insertId field contains the auto-generated ID from the database (though user_id is provided)
    return NextResponse.json({
      success: true,
      message: "User created successfully",
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
        error: "Failed to create user",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Fetch all users from the database
 *
 * This endpoint retrieves all users from the users table.
 *
 * @returns JSON response with success status and array of all users
 */
export async function GET() {
  try {
    // Execute the SELECT query using the SQL file from sql/queries/getAllUsers.sql
    // The executeQuery function reads the SQL file and executes it using the connection pool
    const users = await executeQuery<User>("queries/getAllUsers.sql");

    // Return success response with the users array
    // This confirms that the database connection is working and data can be retrieved
    return NextResponse.json({
      success: true,
      message: "Users retrieved successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Database query error:", error);

    // Return error response with details
    // This helps identify connection issues or SQL syntax errors
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint - Update user fields in the database
 *
 * This endpoint updates optional user fields (nid_number, phone, role, dob) for an existing user.
 * Used during the user onboarding process to complete user profile information.
 *
 * @param request - Next.js Request object containing JSON body with user update data
 * @returns JSON response with success status and affected rows count
 */
export async function PATCH(request: Request) {
  try {
    // Parse the request body to get user update data
    // The body should contain: userId (required)
    // Optional fields: nidNumber, phone, role, dob (will be updated if provided)
    const body = await request.json();
    const { userId, nidNumber, phone, role, dob } = body;

    // Validate required fields
    // userId is required to identify which user to update
    if (!userId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Please provide userId",
        },
        { status: 400 }
      );
    }

    // Validate role if provided (must be one of the allowed enum values)
    if (role && !["Admin", "Doctor", "Patient"].includes(role)) {
      return NextResponse.json(
        {
          error: "Invalid role",
          message: "Role must be one of: Admin, Doctor, Patient",
        },
        { status: 400 }
      );
    }

    // Execute the UPDATE mutation using the SQL file from sql/mutations/updateUser.sql
    // The executeMutation function reads the SQL file, prepares the statement with parameters,
    // and executes it using the connection pool from db.ts
    // Parameters order matches SQL file: nid_number, phone, role, dob, user_id
    // NULL values are allowed for all optional fields
    const result = await executeMutation("mutations/updateUser.sql", [
      nidNumber ?? null,
      phone ?? null,
      role ?? null,
      dob ?? null,
      userId,
    ]);

    // Return success response with the update result
    // The affectedRows field indicates how many rows were updated (should be 1 if user exists)
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Database mutation error:", error);

    // Return error response with details
    // This helps identify connection issues, SQL syntax errors, or constraint violations
    return NextResponse.json(
      {
        error: "Failed to update user",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
