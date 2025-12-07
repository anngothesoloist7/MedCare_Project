/**
 * Database setup API route
 *
 * This route provides endpoints to set up database tables and schema.
 * It's useful for initializing the database or running migrations.
 *
 * POST /api/setup-db: Creates the medications table
 *
 * Note: In production, you should use proper migration tools instead of this endpoint.
 * This is primarily for development and testing purposes.
 */

import { NextResponse } from "next/server";
import { executeDDL } from "@/utils/sql";

/**
 * POST endpoint - Create the medications table
 *
 * This endpoint executes the DDL statement to create the medications table
 * if it doesn't already exist. It uses the SQL file from sql/schema/create_medications_table.sql
 *
 * @returns JSON response with success status
 */
export async function POST() {
  try {
    // Execute the DDL statement to create the medications table
    // The executeDDL function reads the SQL file and executes it
    // The CREATE TABLE IF NOT EXISTS ensures it won't fail if the table already exists
    await executeDDL("schema/create_medications_table.sql");

    return NextResponse.json({
      success: true,
      message: "Medications table created successfully",
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Database setup error:", error);

    // Return error response with details
    return NextResponse.json(
      {
        error: "Failed to create medications table",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

