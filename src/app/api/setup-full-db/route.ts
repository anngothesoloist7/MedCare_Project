/**
 * Database Setup API Route
 *
 * This route provides endpoints to set up the complete MedCare database:
 * - Create database and tables
 * - Create stored procedures
 * - Create triggers
 * - Create views
 * - Set up RBAC
 */

import { NextResponse } from "next/server";
import { executeDDL } from "@/utils/sql";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setupType } = body;

    const results: { operation: string; success: boolean; message?: string; error?: string }[] = [];

    if (setupType === "full" || setupType === "schema") {
      try {
        // Create main tables
        await executeDDL("schema/create_tables.sql");
        results.push({ operation: "Create Tables", success: true, message: "Main tables created successfully" });
      } catch (error) {
        results.push({
          operation: "Create Tables",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }

      try {
        // Create medications table
        await executeDDL("schema/create_medications_table.sql");
        results.push({ operation: "Create Medications Table", success: true, message: "Medications table created successfully" });
      } catch (error) {
        results.push({
          operation: "Create Medications Table",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (setupType === "full" || setupType === "procedures") {
      try {
        // Create stored procedures
        await executeDDL("procedures/create_procedures.sql");
        results.push({ operation: "Create Procedures", success: true, message: "Stored procedures created successfully" });
      } catch (error) {
        results.push({
          operation: "Create Procedures",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (setupType === "full" || setupType === "triggers") {
      try {
        // Create triggers
        await executeDDL("triggers/create_triggers.sql");
        results.push({ operation: "Create Triggers", success: true, message: "Database triggers created successfully" });
      } catch (error) {
        results.push({
          operation: "Create Triggers",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (setupType === "full" || setupType === "views") {
      try {
        // Create views
        await executeDDL("views/create_views.sql");
        results.push({ operation: "Create Views", success: true, message: "Database views created successfully" });
      } catch (error) {
        results.push({
          operation: "Create Views",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (setupType === "full" || setupType === "rbac") {
      try {
        // Note: RBAC setup uses GRANT statements which are handled as queries
        // This might need to be run with appropriate database privileges
        await executeDDL("queries/rbac_setup.sql");
        results.push({ operation: "Setup RBAC", success: true, message: "Role-based access control configured successfully" });
      } catch (error) {
        results.push({
          operation: "Setup RBAC",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount === totalCount,
      message: `Setup completed: ${successCount}/${totalCount} operations successful`,
      results,
    });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      {
        error: "Database setup failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}