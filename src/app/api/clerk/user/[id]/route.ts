/**
 * GET /api/clerk/user/[id] - Get user name from Clerk API
 *
 * This endpoint fetches user information from Clerk API using the user ID.
 * It returns the user's first name, last name, and a formatted full name.
 * This is used to display patient names in the dashboard since names are not stored in the database.
 *
 * Connected to:
 * - Clerk API via clerkClient from @clerk/nextjs/server
 *
 * Used by:
 * - DoctorDashboard and HistoryQueryDialog to display patient names
 *
 * Route parameters:
 * - id: Clerk user ID (string)
 *
 * @returns JSON response with user name information
 */

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * GET endpoint - Fetch user name from Clerk API
 *
 * This endpoint:
 * 1. Gets the user ID from route parameters
 * 2. Fetches user information from Clerk API
 * 3. Extracts first name, last name, and formats full name
 * 4. Returns name information
 *
 * @param request - Next.js Request object
 * @param params - Route parameters containing user ID
 * @returns JSON response with user name information
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from route parameters
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Fetch user information from Clerk API
    // clerkClient() returns a ClerkClient instance, then we call users.getUser()
    // Reference: https://clerk.com/docs/reference/backend/user/get-user
    const client = await clerkClient();
    const user = await client.users.getUser(id);

    // Extract name information from Clerk user object
    // Clerk user object has firstName, lastName, username, and fullName properties
    // Check for fullName first (if available), then firstName/lastName, then username
    const firstName = user.firstName ?? null;
    const lastName = user.lastName ?? null;
    const username = user.username ?? null;

    // Clerk may have a fullName property directly
    // Otherwise, construct it from firstName and lastName
    let fullName: string;
    if (user.fullName) {
      fullName = user.fullName;
    } else if (firstName && lastName) {
      fullName = `${firstName} ${lastName}`;
    } else if (firstName) {
      fullName = firstName;
    } else if (lastName) {
      fullName = lastName;
    } else if (username) {
      fullName = username;
    } else {
      // Last resort: use email address or user ID
      const emailAddress = user.emailAddresses?.[0]?.emailAddress;
      fullName = emailAddress ?? id;
    }

    // Return name information
    // This structure matches what the frontend expects
    return NextResponse.json({
      success: true,
      data: {
        firstName,
        lastName,
        fullName,
        username: user.username ?? null,
      },
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching user from Clerk:", error);

    // Handle specific Clerk API errors
    // Clerk API may return 404 if user doesn't exist
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User not found in Clerk",
        },
        { status: 404 }
      );
    }

    // Return error response
    // This handles Clerk API errors, network errors, etc.
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
