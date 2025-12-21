/**
 * POST /api/clerk/users/batch - Get multiple user names from Clerk API in batch
 *
 * This endpoint fetches user information from Clerk API for multiple user IDs at once.
 * It returns a map of user IDs to their name information.
 * This is more efficient than fetching users one by one.
 *
 * Connected to:
 * - Clerk API via clerkClient from @clerk/nextjs/server
 *
 * Used by:
 * - DoctorDashboard to fetch patient names in batch
 * - UserDashboard to fetch doctor names in batch
 * - HistoryQueryDialog to fetch user names in batch
 *
 * Request body:
 * {
 *   userIds: string[] - Array of Clerk user IDs to fetch
 * }
 *
 * @returns JSON response with map of user IDs to name information
 */

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Type definition for user name data
 */
type UserNameData = {
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  username: string | null;
};

/**
 * POST endpoint - Fetch multiple user names from Clerk API
 *
 * This endpoint:
 * 1. Gets array of user IDs from request body
 * 2. Fetches user information from Clerk API for each user ID
 * 3. Extracts name information and formats full names
 * 4. Returns map of user IDs to name information
 *
 * @param request - Next.js Request object containing JSON body with userIds array
 * @returns JSON response with map of user IDs to name information
 */
export async function POST(request: Request) {
  try {
    // Parse request body to get user IDs array
    const body = await request.json();
    const { userIds } = body;

    // Validate that userIds is provided and is an array
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "userIds must be a non-empty array",
        },
        { status: 400 }
      );
    }

    // Fetch user information from Clerk API for all user IDs in parallel
    // This is more efficient than fetching them one by one
    // Reference: https://clerk.com/docs/reference/backend/user/get-user
    const client = await clerkClient();
    const userPromises = userIds.map(async (userId: string) => {
      try {
        const user = await client.users.getUser(userId);

        // Extract name information from Clerk user object
        // Clerk user object has firstName, lastName, username, and fullName properties
        const firstName = user.firstName ?? null;
        const lastName = user.lastName ?? null;
        const username = user.username ?? null;

        // Format full name
        // Check for fullName first (if available), then firstName/lastName, then username
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
          fullName = emailAddress ?? userId;
        }

        return {
          userId,
          data: {
            firstName,
            lastName,
            fullName,
            username,
          } as UserNameData,
        };
      } catch (error) {
        // Log error for debugging but don't fail the entire batch
        console.error(`Error fetching user ${userId} from Clerk:`, error);
        
        // Return fallback data for failed user fetches
        return {
          userId,
          data: {
            firstName: null,
            lastName: null,
            fullName: userId, // Use user ID as fallback
            username: null,
          } as UserNameData,
        };
      }
    });

    // Wait for all user fetches to complete
    const userResults = await Promise.all(userPromises);

    // Convert array to map for easier lookup
    // Key: user ID, Value: name data
    const userMap: Record<string, UserNameData> = {};
    userResults.forEach(({ userId, data }) => {
      userMap[userId] = data;
    });

    // Return map of user IDs to name information
    // This structure makes it easy for frontend to look up names by user ID
    return NextResponse.json({
      success: true,
      data: userMap,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching users from Clerk:", error);

    // Return error response
    // This handles JSON parsing errors, Clerk API errors, etc.
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

