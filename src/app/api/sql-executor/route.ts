/**
 * SQL Executor API route
 *
 * This route provides an endpoint to execute raw SQL queries directly.
 * WARNING: This endpoint allows direct database access and should be restricted
 * in production environments. Use with caution.
 *
 * POST /api/sql-executor: Execute raw SQL query
 *
 * Body:
 * {
 *   sql: string - The SQL query to execute
 *   params?: unknown[] - Optional parameters for prepared statements
 * }
 *
 * This route uses the query function from src/utils/db.ts to execute SQL
 * using prepared statements for security (SQL injection protection).
 */

import { NextResponse } from "next/server";
import { query, getConnection } from "@/utils/db";

/**
 * POST endpoint - Execute raw SQL query
 *
 * This endpoint executes a raw SQL query string. It uses prepared statements
 * when parameters are provided to prevent SQL injection attacks.
 *
 * @param request - Next.js Request object containing JSON body with SQL query
 * @returns JSON response with query results or error
 */
export async function POST(request: Request) {
  try {
    // Parse the request body to get SQL query and optional parameters
    const body = await request.json();
    const { sql, params } = body;

    // Validate that SQL query is provided
    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Please provide a valid SQL query string",
        },
        { status: 400 }
      );
    }

    // Validate SQL query is not empty
    if (sql.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "SQL query cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate params if provided (must be an array)
    if (params !== undefined && !Array.isArray(params)) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Params must be an array if provided",
        },
        { status: 400 }
      );
    }

    // Check if the query contains multiple statements (semicolons separating statements)
    // Multiple statements require executing them sequentially
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const hasMultipleStatements = statements.length > 1;

    let results: unknown;

    if (hasMultipleStatements) {
      // For multiple statements, we need to use a connection directly
      // Execute each statement sequentially
      // Note: Only the first statement can use params (prepared statements)
      const connection = await getConnection();
      try {
        const executionResults: unknown[] = [];
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          // Use prepared statements only for the first statement if params are provided
          if (params && i === 0) {
            const [result] = await connection.execute(statement, params);
            executionResults.push(result);
          } else {
            // Execute without params (for SET statements, DROP statements, etc.)
            const [result] = await connection.execute(statement);
            executionResults.push(result);
          }
        }
        // Return the last result (most common use case)
        results = executionResults[executionResults.length - 1];
      } finally {
        connection.release();
      }
    } else {
      // Single statement - use the normal query function with prepared statements
      // The query function uses prepared statements when params are provided,
      // which protects against SQL injection attacks
      // It also handles connection pooling and retries automatically
      results = await query(sql, params);
    }

    // Determine if this was a SELECT query (returns array) or a mutation (returns object with affectedRows)
    const isSelectQuery =
      sql.trim().toUpperCase().startsWith("SELECT") ||
      sql.trim().toUpperCase().startsWith("SHOW") ||
      sql.trim().toUpperCase().startsWith("DESCRIBE") ||
      sql.trim().toUpperCase().startsWith("EXPLAIN");

    // Return success response with results
    // For SELECT queries, results is an array of rows
    // For mutations (INSERT/UPDATE/DELETE), results contains affectedRows and insertId
    return NextResponse.json({
      success: true,
      message: "Query executed successfully",
      isSelectQuery,
      results: Array.isArray(results) ? results : [results],
      rowCount: Array.isArray(results) ? results.length : 1,
      affectedRows:
        results && typeof results === "object" && "affectedRows" in results
          ? results.affectedRows
          : undefined,
      insertId:
        results && typeof results === "object" && "insertId" in results
          ? results.insertId
          : undefined,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("SQL execution error:", error);

    // Return error response with details
    // This helps identify SQL syntax errors, connection issues, or constraint violations
    return NextResponse.json(
      {
        error: "Failed to execute SQL query",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        errorCode:
          error &&
          typeof error === "object" &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : undefined,
      },
      { status: 500 }
    );
  }
}
