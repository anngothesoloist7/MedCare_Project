"use client";

/**
 * Users Management Page
 *
 * This page provides a UI to manage users in the database. It includes:
 * - A button to create the users table (if it doesn't exist)
 * - A form to insert a new user (tests write operation)
 * - A button to fetch all users (tests read operation)
 * - Display area to show the results and any errors
 *
 * This page uses client-side React hooks to handle form submission and API calls.
 * The API endpoints are defined in src/app/api/users/route.ts
 */

import { useState } from "react";

/**
 * Type definition for user data
 * This matches the structure used in the API and database
 * nid_number, phone, role, and dob are optional fields that will be updated during onboarding
 */
type User = {
  user_id: string;
  nid_number: number | null;
  phone: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
  dob: string | null; // Date as string from MySQL DATE type (optional)
  created_at: string;
  updated_at: string;
};

/**
 * Type definition for API response when inserting a user
 */
type InsertResponse = {
  success: boolean;
  message: string;
  insertId: number;
  affectedRows: number;
};

/**
 * Type definition for API response when fetching users
 */
type FetchResponse = {
  success: boolean;
  message: string;
  count: number;
  data: User[];
};

export default function UsersPage() {
  // State for form inputs
  // These values are bound to the form inputs and updated as the user types
  // Only userId is required for user creation - optional fields are updated later during onboarding
  const [userId, setUserId] = useState("");

  // State for API responses and loading states
  // These track the results of database operations and UI feedback
  const [insertResult, setInsertResult] = useState<InsertResponse | null>(null);
  const [fetchResult, setFetchResult] = useState<FetchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<string | null>(null);

  // State for editing user
  // These track which user is being edited and the edit form values
  // Used to update optional fields (nid_number, phone, role, dob) during onboarding
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNidNumber, setEditNidNumber] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"Admin" | "Doctor" | "Patient" | "">(
    ""
  );
  const [editDob, setEditDob] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Handles form submission to insert a new user
   *
   * This function:
   * 1. Validates the form inputs
   * 2. Sends a POST request to /api/users
   * 3. Updates the UI with the result or error
   * 4. Automatically refreshes the user list after successful insert
   */
  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInsertResult(null);
    setIsInserting(true);

    try {
      // Send POST request to the API route
      // The API route will execute the INSERT mutation using the SQL file
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (connection issues, validation errors, etc.)
        throw new Error(data.message ?? data.error ?? "Failed to insert user");
      }

      // Success - update state with the result
      setInsertResult(data);

      // Clear form inputs after successful insert
      setUserId("");

      // Automatically refresh the user list to show the new entry
      await handleFetch();
    } catch (err) {
      // Handle network errors or API errors
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsInserting(false);
    }
  };

  /**
   * Sets up the database by creating the users table
   *
   * This function:
   * 1. Sends a POST request to /api/users/setup
   * 2. Creates the users table if it doesn't exist
   * 3. Updates the UI with success or error message
   */
  const handleSetup = async () => {
    setError(null);
    setSetupResult(null);
    setIsSettingUp(true);

    try {
      const response = await fetch("/api/users/setup", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? data.error ?? "Failed to set up database"
        );
      }

      setSetupResult(data.message ?? "Users table created successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSettingUp(false);
    }
  };

  /**
   * Fetches all users from the database
   *
   * This function:
   * 1. Sends a GET request to /api/users
   * 2. Updates the UI with the fetched users or error
   * 3. Used both manually (via button) and automatically (after insert)
   */
  const handleFetch = async () => {
    setError(null);
    setFetchResult(null);
    setIsFetching(true);

    try {
      // Send GET request to the API route
      // The API route will execute the SELECT query using the SQL file
      const response = await fetch("/api/users");

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (connection issues, SQL errors, etc.)
        throw new Error(data.message ?? data.error ?? "Failed to fetch users");
      }

      // Success - update state with the fetched data
      setFetchResult(data);
    } catch (err) {
      // Handle network errors or API errors
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * Handles starting the edit mode for a user
   *
   * This function:
   * 1. Sets the editing user ID
   * 2. Populates the edit form with the current user values
   * 3. Allows the user to modify the optional fields
   */
  const handleStartEdit = (user: User) => {
    setEditingUserId(user.user_id);
    setEditNidNumber(user.nid_number?.toString() ?? "");
    setEditPhone(user.phone ?? "");
    setEditRole(user.role ?? "");
    setEditDob(user.dob ?? "");
    setError(null);
  };

  /**
   * Handles canceling the edit mode
   *
   * This function clears the edit state and form values
   */
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditNidNumber("");
    setEditPhone("");
    setEditRole("");
    setEditDob("");
  };

  /**
   * Handles updating a user
   *
   * This function:
   * 1. Validates the form inputs
   * 2. Sends a PATCH request to /api/users
   * 3. Updates the UI with the result or error
   * 4. Automatically refreshes the user list after successful update
   */
  const handleUpdate = async () => {
    if (!editingUserId) return;

    setError(null);
    setIsUpdating(true);

    try {
      // Send PATCH request to the API route
      // The API route will execute the UPDATE mutation using the SQL file
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingUserId,
          nidNumber: editNidNumber ? parseInt(editNidNumber, 10) : null,
          phone: editPhone || null,
          role: editRole || null,
          dob: editDob || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (connection issues, validation errors, etc.)
        throw new Error(data.message ?? data.error ?? "Failed to update user");
      }

      // Success - clear edit state
      handleCancelEdit();

      // Automatically refresh the user list to show the updated entry
      await handleFetch();
    } catch (err) {
      // Handle network errors or API errors
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Users management
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Manage users in the database
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Database Setup Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                Database setup
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Create the users table if it doesn&apos;t exist
              </p>
            </div>
            <button
              onClick={handleSetup}
              disabled={isSettingUp}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSettingUp ? "Setting up..." : "Create table"}
            </button>
          </div>

          {/* Setup Result Display */}
          {setupResult && (
            <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
              <p className="font-semibold">Success!</p>
              <p>{setupResult}</p>
            </div>
          )}
        </div>

        {/* Insert Form Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            Add user
          </h2>
          <form onSubmit={handleInsert} className="space-y-4">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                User ID *
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                placeholder="e.g., user_123"
              />
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Optional fields (nid_number, phone, role, dob) can be updated
              later during onboarding.
            </p>

            <button
              type="submit"
              disabled={isInserting}
              className="w-full rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {isInserting ? "Adding..." : "Add user"}
            </button>
          </form>

          {/* Insert Result Display */}
          {insertResult && (
            <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
              <p className="font-semibold">Success!</p>
              <p>{insertResult.message}</p>
              <p className="mt-1 text-sm">
                Affected rows: {insertResult.affectedRows}
              </p>
            </div>
          )}
        </div>

        {/* Fetch Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              All users
            </h2>
            <button
              onClick={handleFetch}
              disabled={isFetching}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              {isFetching ? "Loading..." : "Fetch users"}
            </button>
          </div>

          {/* Fetch Result Display */}
          {fetchResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <p className="font-semibold">Success!</p>
                <p>
                  {fetchResult.message} | Found {fetchResult.count} user
                  {fetchResult.count !== 1 ? "s" : ""}
                </p>
              </div>

              {fetchResult.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800">
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          User ID
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          National ID
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Phone
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Role
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Date of birth
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Created at
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetchResult.data.map((user) => (
                        <tr
                          key={user.user_id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          {editingUserId === user.user_id ? (
                            // Edit mode - show edit form
                            <>
                              <td className="border border-zinc-300 px-4 py-2 text-sm font-medium text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.user_id}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <input
                                  type="number"
                                  value={editNidNumber}
                                  onChange={(e) =>
                                    setEditNidNumber(e.target.value)
                                  }
                                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                                  placeholder="National ID"
                                />
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <input
                                  type="tel"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                                  placeholder="Phone"
                                />
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <select
                                  value={editRole}
                                  onChange={(e) =>
                                    setEditRole(
                                      e.target.value as
                                        | "Admin"
                                        | "Doctor"
                                        | "Patient"
                                        | ""
                                    )
                                  }
                                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                                >
                                  <option value="">Select role</option>
                                  <option value="Patient">Patient</option>
                                  <option value="Doctor">Doctor</option>
                                  <option value="Admin">Admin</option>
                                </select>
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <input
                                  type="date"
                                  value={editDob}
                                  onChange={(e) => setEditDob(e.target.value)}
                                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                                />
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {new Date(user.created_at).toLocaleString()}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                                  >
                                    {isUpdating ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    className="rounded-md bg-zinc-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-500 dark:hover:bg-zinc-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View mode - show user data
                            <>
                              <td className="border border-zinc-300 px-4 py-2 text-sm font-medium text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.user_id}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.nid_number ?? (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.phone ?? (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.role ? (
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                      user.role === "Admin"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                        : user.role === "Doctor"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {user.dob ? (
                                  new Date(user.dob).toLocaleDateString()
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                {new Date(user.created_at).toLocaleString()}
                              </td>
                              <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                                <button
                                  onClick={() => handleStartEdit(user)}
                                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                >
                                  Edit
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  No users found in the database.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
