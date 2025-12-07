/**
 * Example API route demonstrating MySQL database usage
 *
 * This file shows how to use the SQL execution utilities to perform CRUD operations
 * on the Railway MySQL database. SQL queries are stored in separate .sql files to
 * avoid merge conflicts with TypeScript code.
 *
 * DELETE THIS FILE once you start implementing your actual API routes.
 */

import { NextResponse } from "next/server";
// Uncomment when ready to use:
// import { executeQuery, executeMutation } from '@/utils/sql';

/**
 * Example GET endpoint - Reading data from database
 *
 * This demonstrates how to execute SELECT queries stored in sql/queries/
 *
 * DELETE THIS FILE once you start implementing your actual API routes.
 */
export async function GET() {
  try {
    // Example: Get a user by ID (uncomment and use when ready)
    // const userId = new URL(request.url).searchParams.get('userId');
    // const users = await executeQuery('queries/getUserById.sql', [userId]);

    // For demonstration, return a success message
    return NextResponse.json({
      message: "Database connection successful",
      // Uncomment when ready:
      // data: users,
    });
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { error: "Failed to query database" },
      { status: 500 }
    );
  }
}

/**
 * Example POST endpoint - Writing data to database
 *
 * This demonstrates how to execute INSERT/UPDATE/DELETE queries stored in sql/mutations/
 *
 * DELETE THIS FILE once you start implementing your actual API routes.
 */
export async function POST() {
  try {
    // Example: Create a new user (uncomment and use when ready)
    // const body = await request.json();
    // const { name, email, passwordHash, role } = body;
    // const result = await executeMutation('mutations/createUser.sql', [name, email, passwordHash, role]);

    // return NextResponse.json({
    //   message: 'User created successfully',
    //   insertId: result.insertId,
    // });

    // For demonstration, return a success message
    return NextResponse.json({
      message: "Database mutation endpoint ready",
    });
  } catch (error) {
    console.error("Database mutation error:", error);
    return NextResponse.json(
      { error: "Failed to execute database mutation" },
      { status: 500 }
    );
  }
}
