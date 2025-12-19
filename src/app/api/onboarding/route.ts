/**
 * POST /api/onboarding - Complete user onboarding
 *
 * This endpoint handles the onboarding form submission. It validates required fields
 * based on the selected role (Doctor vs Patient) and updates the users table with
 * all onboarding data including role-specific fields.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeMutation and executeQuery utilities (src/utils/sql.ts)
 * - Users table: updateUserOnboarding.sql mutation (updates all fields in single query)
 *
 * Validation Rules:
 * - All roles: nidNumber, phone, role, dob are required
 * - Doctor role: speciality is additionally required
 * - Patient role: age, height, gender are additionally required
 *
 * Flow:
 * 1. Validate authentication and get user ID from Clerk
 * 2. Validate required fields based on role
 * 3. Update users table with all onboarding data (common + role-specific fields)
 * 4. Return success or error response
 *
 * @returns JSON response with success status or validation/error messages
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeMutation } from "@/utils/sql";
import { executeQuery } from "@/utils/sql";

/**
 * Type definition for onboarding request body
 * All fields are optional in the type, but validation ensures required fields are present
 */
type OnboardingRequest = {
  nidNumber?: string;
  phone?: string;
  role?: "Doctor" | "Patient";
  dob?: string; // Date string in YYYY-MM-DD format
  speciality?: string; // Required if role is Doctor
  age?: number; // Required if role is Patient
  height?: number; // Required if role is Patient (in meters, e.g., 1.75)
  gender?: "male" | "female" | "other"; // Required if role is Patient
};

/**
 * Type definition for a user record from the database
 * Used to check if user already exists and has completed onboarding
 */
type User = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: string | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * POST endpoint - Complete user onboarding
 *
 * This endpoint validates the onboarding form data, updates the user record,
 * and creates the corresponding patient or doctor record.
 *
 * @param request - Next.js Request object containing JSON body with onboarding data
 * @returns JSON response with success status or error message
 */
export async function POST(request: Request) {
  try {
    // Get the authenticated user ID from Clerk
    // auth() throws an error if user is not authenticated, but middleware should protect this route
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User is not authenticated",
        },
        { status: 401 }
      );
    }

    // Parse the request body to get onboarding data
    const body: OnboardingRequest = await request.json();
    const { nidNumber, phone, role, dob, speciality, age, height, gender } =
      body;

    // Validate required fields for all roles
    // These fields are mandatory regardless of whether user is Doctor or Patient
    if (!nidNumber || !phone || !role || !dob) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message:
            "Please provide all required fields: nidNumber, phone, role, and dob",
        },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    if (role !== "Doctor" && role !== "Patient") {
      return NextResponse.json(
        {
          error: "Invalid role",
          message: "Role must be either 'Doctor' or 'Patient'",
        },
        { status: 400 }
      );
    }

    // Validate role-specific required fields
    // Doctor role requires speciality field
    if (role === "Doctor" && !speciality) {
      return NextResponse.json(
        {
          error: "Missing required field",
          message: "Speciality is required for Doctor role",
        },
        { status: 400 }
      );
    }

    // Patient role requires age, height, and gender fields
    if (role === "Patient") {
      if (age === undefined || age === null) {
        return NextResponse.json(
          {
            error: "Missing required field",
            message: "Age is required for Patient role",
          },
          { status: 400 }
        );
      }
      if (height === undefined || height === null) {
        return NextResponse.json(
          {
            error: "Missing required field",
            message: "Height is required for Patient role",
          },
          { status: 400 }
        );
      }
      if (!gender) {
        return NextResponse.json(
          {
            error: "Missing required field",
            message: "Gender is required for Patient role",
          },
          { status: 400 }
        );
      }
      // Validate gender enum value
      if (!["male", "female", "other"].includes(gender)) {
        return NextResponse.json(
          {
            error: "Invalid gender",
            message: "Gender must be one of: male, female, other",
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists and has completed onboarding
    // This prevents duplicate onboarding submissions
    const existingUsers = await executeQuery<User>("queries/getUserById.sql", [
      userId,
    ]);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User record not found in database",
        },
        { status: 404 }
      );
    }

    const existingUser = existingUsers[0];

    // If user already has nid_number, they've completed onboarding
    // Don't allow re-onboarding (though this should be prevented by middleware redirect)
    if (existingUser.nid_number !== null) {
      return NextResponse.json(
        {
          error: "Already onboarded",
          message: "User has already completed onboarding",
        },
        { status: 400 }
      );
    }

    // Check if the nid_number is already in use by another user
    // This prevents duplicate national ID numbers (enforced by UNIQUE constraint)
    const usersWithNid = await executeQuery<User>(
      "queries/getUserByNidNumber.sql",
      [nidNumber]
    );

    if (usersWithNid.length > 0 && usersWithNid[0].user_id !== userId) {
      return NextResponse.json(
        {
          error: "Duplicate national ID",
          message:
            "This national ID number is already registered to another account",
        },
        { status: 400 }
      );
    }

    // Update users table with all onboarding data
    // This includes common fields and role-specific fields in a single update
    // Convert role to match database enum format (capitalize first letter)
    const roleCapitalized =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    // Prepare role-specific fields - set to NULL for the role that doesn't use them
    // Parameters order matches updateUserOnboarding.sql:
    // nid_number, phone, role, dob, speciality, age, height, gender, user_id
    const updateParams = [
      nidNumber,
      phone,
      roleCapitalized,
      dob,
      role === "Doctor" ? speciality : null, // speciality: required for Doctor, NULL for Patient
      role === "Patient" ? age : null, // age: required for Patient, NULL for Doctor
      role === "Patient" ? height : null, // height: required for Patient, NULL for Doctor
      role === "Patient" ? gender : null, // gender: required for Patient, NULL for Doctor
      userId,
    ];

    const updateResult = await executeMutation(
      "mutations/updateUserOnboarding.sql",
      updateParams
    );

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        {
          error: "Update failed",
          message: "Failed to update user record",
        },
        { status: 500 }
      );
    }

    // Return success response
    // User onboarding is now complete, middleware will redirect them away from /onboarding
    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      role: roleCapitalized,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Onboarding error:", error);

    // Return error response with details
    // This handles database errors, validation errors, etc.
    return NextResponse.json(
      {
        error: "Failed to complete onboarding",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
