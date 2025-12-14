/**
 * Comprehensive SQL Testing API Route
 *
 * This route provides endpoints to test all SQL operations in the MedCare database:
 * - DDL operations (CREATE, ALTER, DROP)
 * - Queries (SELECT)
 * - Mutations (INSERT, UPDATE, DELETE)
 * - Stored procedures
 * - Transactions
 */

import { NextResponse } from "next/server";
import {
  executeQuery,
  executeMutation,
  executeProcedure,
  executeDDL,
  executeTransaction,
} from "@/utils/sql";

/**
 * POST endpoint - Execute various SQL operations
 *
 * Supports different operation types:
 * - ddl: Data Definition Language (CREATE, ALTER, DROP)
 * - query: SELECT queries
 * - mutation: INSERT, UPDATE, DELETE
 * - procedure: Stored procedure calls
 * - transaction: Multiple operations in a transaction
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { operation, filePath, params, queries } = body;

    if (!operation) {
      return NextResponse.json(
        { error: "Missing operation type" },
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case "ddl":
        if (!filePath) {
          return NextResponse.json(
            { error: "Missing filePath for DDL operation" },
            { status: 400 }
          );
        }
        await executeDDL(filePath);
        result = { success: true, message: "DDL operation completed" };
        break;

      case "query":
        if (!filePath) {
          return NextResponse.json(
            { error: "Missing filePath for query operation" },
            { status: 400 }
          );
        }
        result = await executeQuery(filePath, params);
        break;

      case "mutation":
        if (!filePath) {
          return NextResponse.json(
            { error: "Missing filePath for mutation operation" },
            { status: 400 }
          );
        }
        result = await executeMutation(filePath, params);
        break;

      case "procedure":
        if (!filePath) {
          return NextResponse.json(
            { error: "Missing filePath for procedure operation" },
            { status: 400 }
          );
        }
        result = await executeProcedure(filePath, params);
        break;

      case "transaction":
        if (!queries || !Array.isArray(queries)) {
          return NextResponse.json(
            { error: "Missing queries array for transaction operation" },
            { status: 400 }
          );
        }
        result = await executeTransaction(queries);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
    });
  } catch (error) {
    console.error("SQL operation error:", error);
    return NextResponse.json(
      {
        error: "SQL operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Get available SQL files by category
 */
export async function GET() {
  try {
    // This would ideally scan the sql directory, but for now return known files
    const sqlFiles = {
      schema: [
        "schema/create_tables.sql",
        "schema/create_medications_table.sql",
      ],
      queries: [
        "queries/getAllMedications.sql",
        "queries/example.sql",
        "queries/rbac_setup.sql",
      ],
      mutations: [
        "mutations/insertMedication.sql",
        "mutations/insert_data.sql",
      ],
      procedures: [
        "procedures/create_procedures.sql",
      ],
      triggers: [
        "triggers/create_triggers.sql",
      ],
      views: [
        "views/create_views.sql",
      ],
    };

    return NextResponse.json({
      success: true,
      sqlFiles,
    });
  } catch (error) {
    console.error("Error fetching SQL files:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch SQL files",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}