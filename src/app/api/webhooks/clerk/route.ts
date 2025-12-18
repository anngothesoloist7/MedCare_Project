/**
 * Clerk webhook handler for syncing user data to the database
 *
 * This endpoint handles user lifecycle events from Clerk:
 * - user.created: Creates a new user record in the database with default values
 * - user.deleted: Removes user and all related data (cascade delete)
 *
 * Connected to:
 * - MySQL database via executeQuery and executeMutation utilities (src/utils/sql.ts)
 * - Users table (sql/schema/create_users.sql): Stores Clerk user ID as primary key (user_id)
 * - SQL mutations: createUserFromClerk.sql and deleteUserByClerkId.sql in sql/mutations/
 * - SQL queries: getUserById.sql in sql/queries/ for checking user existence
 * - Cascade deletion: When user is deleted, related records in patients/doctors tables are removed
 *   automatically due to foreign key constraints defined in the database schema
 *
 * Setup:
 * 1. Configure webhook URL in Clerk Dashboard: https://your-domain.com/api/webhooks/clerk
 * 2. Add CLERK_WEBHOOK_SIGNING_SECRET to .env (provided by Clerk when creating webhook endpoint)
 * 3. Select events to listen for: user.created, user.deleted
 * 4. Ensure svix package is installed (already included in package.json)
 *
 * Flow:
 * 1. Clerk sends webhook when user event occurs (via Svix service)
 * 2. Webhook signature is verified using Svix library to ensure request authenticity
 * 3. Based on event type, executes appropriate SQL mutation file from sql/mutations/
 * 4. User data is synced between Clerk (authentication provider) and our MySQL database (application data)
 * 5. Database operations use prepared statements via executeMutation/executeQuery for SQL injection protection
 *
 * Error Handling:
 * - Race conditions: Checks if user exists before creating to handle webhook retries
 * - Idempotent operations: Returns success even if user already exists or doesn't exist (for delete)
 * - Detailed error logging: Logs error codes, messages, and user IDs for debugging
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { executeQuery } from "@/utils/sql";
import { executeMutation } from "@/utils/sql";

/**
 * Type definition for a user record in the database
 * Matches the structure of the users table schema
 * Note: nid_number, phone, and role are optional fields that will be updated during onboarding
 */
type User = {
  user_id: string;
  nid_number: number | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: Date;
  created_at: Date;
  updated_at: Date;
};

/**
 * POST endpoint - Handle Clerk webhook events
 *
 * This endpoint receives webhook events from Clerk and syncs user data to the database.
 * It verifies the webhook signature to ensure the request is from Clerk, then processes
 * the event based on its type (user.created or user.deleted).
 *
 * @param req - Next.js Request object containing the webhook payload
 * @returns JSON response indicating success or failure
 */
export async function POST(req: NextRequest) {
  console.log("🔔 Clerk webhook received!");

  // Get the headers required for webhook verification
  // Svix (Clerk's webhook service) includes these headers for signature verification
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  console.log("📋 Headers:", {
    svixId: svixId ? "present" : "missing",
    svixTimestamp: svixTimestamp ? "present" : "missing",
    svixSignature: svixSignature ? "present" : "missing",
  });

  // If there are no headers, error out
  // These headers are required for webhook verification
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("❌ Missing svix headers");
    return new NextResponse("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the raw request body as text for signature verification
  // We need the raw body, not parsed JSON, to verify the signature
  const payload = await req.text();

  // Get the webhook signing secret from environment variables
  // This secret is provided by Clerk when you create a webhook endpoint
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error("❌ CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return new NextResponse("Error occurred -- webhook secret not configured", {
      status: 500,
    });
  }

  // Create a new Svix instance with your webhook secret
  // Svix is the service Clerk uses to send webhooks
  const wh = new Webhook(signingSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  // This ensures the webhook is authentic and from Clerk
  try {
    console.log("🔐 Verifying webhook signature...");
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return new NextResponse("Error occurred -- webhook verification failed", {
      status: 400,
    });
  }

  try {
    console.log(`📋 Processing Clerk webhook event: ${evt.type}`);

    // Handle the webhook event based on its type
    const eventType = evt.type;

    switch (eventType) {
      case "user.created": {
        const { id } = evt.data;

        console.log(`👤 Creating user in database with Clerk ID: ${id}`);

        // Check if user already exists (race condition protection)
        // This can happen if:
        // 1. Webhook is retried by Clerk (webhooks are retried on failure)
        // 2. User was created through another flow (e.g., manual database insert)
        // 3. Multiple webhook deliveries for the same event
        // We use getUserById.sql query to check existence before attempting insert
        console.log(`🔍 [Webhook] Checking if user exists: ${id}`);
        const existingUsers = await executeQuery<User>(
          "queries/getUserById.sql",
          [id]
        );
        console.log(`✅ [Webhook] User existence check completed`, {
          userId: id,
          exists: existingUsers.length > 0,
        });

        if (existingUsers.length > 0) {
          console.log(
            `✅ User already exists in database: ${existingUsers[0]?.user_id}`
          );
          // Return success status to acknowledge webhook receipt (idempotent operation)
          // This prevents Clerk from retrying the webhook unnecessarily
          return new NextResponse("User already exists", { status: 200 });
        }

        // Note: nid_number, phone, role, and dob are optional fields that will be updated during onboarding
        // They are not included in the initial user creation - only user_id is required
        try {
          // Insert user into database using the mutation SQL file from sql/mutations/createUserFromClerk.sql
          // The executeMutation function reads the SQL file, prepares the statement with parameters,
          // and executes it using the connection pool from src/utils/db.ts
          // Parameters order matches SQL file: user_id only
          // Note: nid_number, phone, role, and dob are optional and will be updated during onboarding
          console.log(`🔍 [Webhook] Executing createUserFromClerk mutation`, {
            userId: id,
          });
          const result = await executeMutation(
            "mutations/createUserFromClerk.sql",
            [id]
          );

          console.log(
            `✅ User created successfully in database with ID: ${id} (insertId: ${result.insertId}, affectedRows: ${result.affectedRows})`
          );

          // Return success response to acknowledge webhook receipt
          // Clerk will mark this webhook as successfully processed
          return new NextResponse("User created successfully", { status: 200 });
        } catch (error) {
          // Enhanced error handling for database insertion failures
          // Log detailed error information for debugging production issues
          console.error("❌ Failed to create user in database:", {
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            errorCode:
              error &&
              typeof error === "object" &&
              "code" in error &&
              typeof error.code === "string"
                ? error.code
                : "N/A",
            userId: id,
            timestamp: new Date().toISOString(),
          });

          // Check if user was created despite the error (race condition handling)
          // This can happen if:
          // 1. Another webhook delivery created the user between our check and insert
          // 2. Database constraint violation occurred but user was still created
          // 3. Transaction rollback didn't occur properly
          console.log(
            `🔍 [Webhook] Checking if user exists after error (race condition check)`
          );
          const checkUsers = await executeQuery<User>(
            "queries/getUserById.sql",
            [id]
          );
          console.log(`✅ [Webhook] Post-error existence check completed`, {
            userId: id,
            exists: checkUsers.length > 0,
          });
          if (checkUsers.length > 0) {
            console.log(
              `✅ User exists after error check (race condition handled): ${checkUsers[0]?.user_id}`
            );
            // Return success since user exists (idempotent operation)
            return new NextResponse("User already exists", { status: 200 });
          }

          // Return error response if user creation failed and user doesn't exist
          // Clerk will retry the webhook if we return a 5xx status code
          return new NextResponse("Failed to create user", { status: 500 });
        }
      }

      case "user.deleted": {
        const { id } = evt.data;

        // Validate that user ID is provided in the webhook payload
        // This is a safety check to prevent attempting deletion with undefined/null ID
        if (!id) {
          console.error("❌ No user ID provided for deletion");
          return new NextResponse("No user ID provided", { status: 400 });
        }

        console.log(`🗑️ Deleting user from database with Clerk ID: ${id}`);

        // Check if user exists before attempting deletion
        // This prevents unnecessary database operations and provides better logging
        // Uses getUserById.sql query to check user existence
        console.log(
          `🔍 [Webhook] Checking if user exists before deletion: ${id}`
        );
        const existingUsers = await executeQuery<User>(
          "queries/getUserById.sql",
          [id]
        );
        console.log(`✅ [Webhook] User existence check completed`, {
          userId: id,
          exists: existingUsers.length > 0,
        });

        if (existingUsers.length === 0) {
          console.log(
            `⚠️ User not found in database (may have been already deleted): ${id}`
          );
          // Return success even if user doesn't exist (idempotent operation)
          // This ensures webhook processing succeeds even if user was already deleted
          // Prevents Clerk from retrying the webhook unnecessarily
          return new NextResponse("User not found (already deleted)", {
            status: 200,
          });
        }

        try {
          // Delete user from database using the mutation SQL file from sql/mutations/deleteUserByClerkId.sql
          // The executeMutation function reads the SQL file and executes the DELETE statement
          // Cascade deletion: Foreign key constraints in patients/doctors tables will automatically
          // delete related records when the user is deleted (ON DELETE CASCADE)
          // This ensures data consistency and prevents orphaned records
          console.log(`🔍 [Webhook] Executing deleteUserByClerkId mutation`, {
            userId: id,
          });
          const result = await executeMutation(
            "mutations/deleteUserByClerkId.sql",
            [id]
          );

          console.log(
            `✅ User deleted successfully from database: ${id} (affectedRows: ${result.affectedRows})`
          );

          // Return success response to acknowledge webhook receipt
          // Clerk will mark this webhook as successfully processed
          return new NextResponse("User deleted successfully", { status: 200 });
        } catch (error) {
          // Enhanced error handling for database deletion failures
          // Log detailed error information for debugging production issues
          console.error("❌ Failed to delete user from database:", {
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            errorCode:
              error &&
              typeof error === "object" &&
              "code" in error &&
              typeof error.code === "string"
                ? error.code
                : "N/A",
            userId: id,
            timestamp: new Date().toISOString(),
          });

          // Return error response so Clerk can retry the webhook
          // Clerk will retry failed webhooks up to a certain number of times
          return new NextResponse("Failed to delete user", { status: 500 });
        }
      }

      default:
        // Log unhandled event types but don't return error
        // This allows the webhook to succeed even if we don't handle all event types
        // Clerk may send other event types (e.g., user.updated, session.created) that we don't need
        // Returning 200 prevents Clerk from retrying unhandled events unnecessarily
        console.log(`⚡ Unhandled webhook event type: ${eventType}`);
        return new NextResponse(`Event type ${eventType} not handled`, {
          status: 200,
        });
    }
  } catch (error) {
    // Handle unexpected errors during event processing
    // This catch block handles errors that occur outside of the switch statement
    // Examples: database connection errors, SQL syntax errors, etc.
    console.error("❌ Error processing webhook event:", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      eventType: evt.type,
      timestamp: new Date().toISOString(),
    });

    // Return error response so Clerk can retry the webhook
    // Clerk will retry failed webhooks up to a certain number of times
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}

/**
 * GET endpoint - Test webhook URL accessibility
 *
 * This endpoint allows testing that the webhook URL is reachable.
 * Useful for verifying the endpoint is configured correctly in Clerk Dashboard.
 * Clerk Dashboard may send GET requests to verify the endpoint is accessible
 * before accepting webhook deliveries.
 *
 * Connected to:
 * - Clerk Dashboard: Used to verify webhook endpoint configuration
 * - No database operations: This is a simple health check endpoint
 *
 * @returns Plain text response confirming the endpoint is reachable
 */
export async function GET() {
  console.log("🔍 Clerk webhook endpoint GET request received");
  return new NextResponse("Clerk webhook endpoint is reachable! 🚀", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
