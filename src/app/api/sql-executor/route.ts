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

    // Check if the query contains DDL statements (CREATE, DROP, ALTER, etc.)
    // DDL statements cannot use prepared statements and must be executed as raw queries
    const sqlUpper = sql.trim().toUpperCase();
    const isDDLStatement =
      sqlUpper.startsWith("CREATE") ||
      sqlUpper.startsWith("DROP") ||
      sqlUpper.startsWith("ALTER") ||
      sqlUpper.startsWith("TRUNCATE") ||
      sqlUpper.startsWith("RENAME");

    // Check if the query contains CREATE/DROP PROCEDURE or TRIGGER statements
    // These need special handling as they may contain semicolons inside the body
    // We cannot split by semicolon because CREATE PROCEDURE has semicolons inside BEGIN...END
    // CREATE TRIGGER with single statements don't have this issue but still need raw query execution
    const hasProcedureStatement =
      sqlUpper.includes("CREATE PROCEDURE") ||
      sqlUpper.includes("DROP PROCEDURE");

    // Check if query contains TRIGGER statements
    // TRIGGER statements cannot be executed as prepared statements (MySQL limitation)
    // They must be executed using connection.query() instead of connection.execute()
    const hasTriggerStatement =
      sqlUpper.includes("CREATE TRIGGER") || sqlUpper.includes("DROP TRIGGER");

    // For procedures, we need to parse them properly
    // DROP PROCEDURE statements end with a semicolon after the procedure name
    // CREATE PROCEDURE statements end with END;
    // Need to match the outermost END; (not inner END; from DECLARE handlers)
    let statements: string[] = [];
    if (hasProcedureStatement) {
      // Strategy: Process SQL sequentially, identifying complete procedure statements
      // Find all procedure boundaries (CREATE/DROP PROCEDURE)
      const procedureBoundaries: Array<{
        type: "DROP" | "CREATE";
        index: number;
      }> = [];
      const dropRegex = /DROP\s+PROCEDURE/gi;
      const createRegex = /CREATE\s+PROCEDURE/gi;
      let match;

      while ((match = dropRegex.exec(sql)) !== null) {
        procedureBoundaries.push({ type: "DROP", index: match.index ?? 0 });
      }
      while ((match = createRegex.exec(sql)) !== null) {
        procedureBoundaries.push({ type: "CREATE", index: match.index ?? 0 });
      }

      // Sort by position
      procedureBoundaries.sort((a, b) => a.index - b.index);

      // Process each procedure statement
      for (let i = 0; i < procedureBoundaries.length; i++) {
        const boundary = procedureBoundaries[i];
        const startIndex = boundary.index;
        const nextBoundaryIndex =
          i < procedureBoundaries.length - 1
            ? procedureBoundaries[i + 1].index
            : sql.length;

        if (boundary.type === "DROP") {
          // DROP PROCEDURE ends at the first semicolon after the procedure name
          const dropBlock = sql.substring(startIndex, nextBoundaryIndex);
          const semicolonIndex = dropBlock.indexOf(";");
          if (semicolonIndex !== -1) {
            statements.push(
              sql.substring(startIndex, startIndex + semicolonIndex + 1).trim()
            );
          }
        } else {
          // CREATE PROCEDURE - find the last END; before next boundary
          // This END; closes the procedure (not inner END; from DECLARE handlers)
          const createBlock = sql.substring(startIndex, nextBoundaryIndex);
          const endMatches = [...createBlock.matchAll(/END\s*;/gi)];
          if (endMatches.length > 0) {
            const lastEndMatch = endMatches[endMatches.length - 1];
            if (lastEndMatch.index !== undefined) {
              const endIndex =
                startIndex + lastEndMatch.index + lastEndMatch[0].length;
              // Include everything from CREATE PROCEDURE to the final END;
              // Don't trim here - preserve the exact SQL structure
              const procedureStatement = sql.substring(startIndex, endIndex);
              statements.push(procedureStatement);
            } else {
              // If no END; found, include the entire block (might be incomplete)
              statements.push(sql.substring(startIndex, nextBoundaryIndex));
            }
          } else {
            // No END; found - include entire block
            statements.push(sql.substring(startIndex, nextBoundaryIndex));
          }
        }
      }

      // If no boundaries found, treat entire SQL as single statement
      if (statements.length === 0) {
        statements = [sql.trim()];
      }
    } else {
      // For non-procedure statements, split by semicolons normally
      statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const hasMultipleStatements = statements.length > 1;

    let results: unknown;

    // For DDL statements, multiple statements, or TRIGGER statements, use a connection directly
    // DDL statements and TRIGGER statements must be executed as raw queries (not prepared statements)
    // MySQL's prepared statement protocol doesn't support CREATE/DROP TRIGGER commands
    if (isDDLStatement || hasMultipleStatements || hasTriggerStatement) {
      const connection = await getConnection();
      try {
        const executionResults: unknown[] = [];
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          const statementUpper = statement.trim().toUpperCase();

          // Check if this specific statement is a DDL statement or TRIGGER statement
          // These must use connection.query() instead of connection.execute()
          const isStatementDDL =
            statementUpper.startsWith("CREATE") ||
            statementUpper.startsWith("DROP") ||
            statementUpper.startsWith("ALTER") ||
            statementUpper.startsWith("TRUNCATE") ||
            statementUpper.startsWith("RENAME");

          // Check if this statement involves triggers (not supported in prepared statements)
          const isStatementTrigger = statementUpper.includes("TRIGGER");

          if (isStatementDDL || isStatementTrigger) {
            // DDL and TRIGGER statements must be executed as raw queries (not prepared statements)
            // Use connection.query() instead of connection.execute()
            // MySQL's prepared statement protocol doesn't support these commands
            const [result] = await connection.query(statement);
            executionResults.push(result);
          } else if (params && i === 0) {
            // Use prepared statements for the first statement if params are provided
            const [result] = await connection.execute(statement, params);
            executionResults.push(result);
          } else {
            // Execute without params using prepared statements
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
      // Single non-DDL statement - use the normal query function with prepared statements
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
