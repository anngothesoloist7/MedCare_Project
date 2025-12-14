"use client";

/**
 * Test Database Connection Page
 *
 * This page provides a UI to test the connection between Next.js and the Railway MySQL database.
 * It includes:
 * - A form to insert a new medication (tests write operation)
 * - A button to fetch all medications (tests read operation)
 * - Display area to show the results and any errors
 *
 * This page uses client-side React hooks to handle form submission and API calls.
 * The API endpoints are defined in src/app/api/test-db/route.ts
 */

import { useState } from "react";

/**
 * Type definition for medication data
 * This matches the structure used in the API and database
 * Note: MySQL DECIMAL values are returned as strings, so unit_price is string | number
 */
type Medication = {
  medication_id: number;
  name: string;
  description: string | null;
  stock_quantity: number;
  unit_price: number | string; // MySQL DECIMAL returns as string
  created_at: string;
};

/**
 * Type definition for API response when inserting a medication
 */
type InsertResponse = {
  success: boolean;
  message: string;
  insertId: number;
  affectedRows: number;
};

/**
 * Type definition for API response when fetching medications
 */
type FetchResponse = {
  success: boolean;
  message: string;
  count: number;
  data: Medication[];
};

export default function TestDbPage() {
  // State for form inputs
  // These values are bound to the form inputs and updated as the user types
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  // State for API responses and loading states
  // These track the results of database operations and UI feedback
  const [insertResult, setInsertResult] = useState<InsertResponse | null>(null);
  const [fetchResult, setFetchResult] = useState<FetchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<string | null>(null);

  /**
   * Handles form submission to insert a new medication
   *
   * This function:
   * 1. Validates the form inputs
   * 2. Sends a POST request to /api/test-db
   * 3. Updates the UI with the result or error
   * 4. Automatically refreshes the medication list after successful insert
   */
  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInsertResult(null);
    setIsInserting(true);

    try {
      // Send POST request to the API route
      // The API route will execute the INSERT mutation using the SQL file
      const response = await fetch("/api/test-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || null,
          stockQuantity: parseInt(stockQuantity, 10),
          unitPrice: parseFloat(unitPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (connection issues, validation errors, etc.)
        throw new Error(
          data.message ?? data.error ?? "Failed to insert medication"
        );
      }

      // Success - update state with the result
      setInsertResult(data);

      // Clear form inputs after successful insert
      setName("");
      setDescription("");
      setStockQuantity("");
      setUnitPrice("");

      // Automatically refresh the medication list to show the new entry
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
   * Sets up the database by creating the medications table
   *
   * This function:
   * 1. Sends a POST request to /api/setup-db
   * 2. Creates the medications table if it doesn't exist
   * 3. Updates the UI with success or error message
   */
  const handleSetup = async () => {
    setError(null);
    setSetupResult(null);
    setIsSettingUp(true);

    try {
      const response = await fetch("/api/setup-db", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? data.error ?? "Failed to set up database"
        );
      }

      setSetupResult(data.message ?? "Database setup completed successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSettingUp(false);
    }
  };

  /**
   * Fetches all medications from the database
   *
   * This function:
   * 1. Sends a GET request to /api/test-db
   * 2. Updates the UI with the fetched medications or error
   * 3. Used both manually (via button) and automatically (after insert)
   */
  const handleFetch = async () => {
    setError(null);
    setFetchResult(null);
    setIsFetching(true);

    try {
      // Send GET request to the API route
      // The API route will execute the SELECT query using the SQL file
      const response = await fetch("/api/test-db");

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (connection issues, SQL errors, etc.)
        throw new Error(
          data.message ?? data.error ?? "Failed to fetch medications"
        );
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

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Database connection test
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Test the connection between Next.js and Railway MySQL database
          </p>
          <div className="mt-4">
            <a
              href="/sql-test"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Advanced SQL Testing →
            </a>
          </div>
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
                Create the medications table if it doesn&apos;t exist
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
            Insert medication (test write operation)
          </h2>
          <form onSubmit={handleInsert} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Medication name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                placeholder="e.g., Paracetamol 500mg"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="stockQuantity"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Stock quantity *
                </label>
                <input
                  id="stockQuantity"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                  min="0"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label
                  htmlFor="unitPrice"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Unit price *
                </label>
                <input
                  id="unitPrice"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  placeholder="e.g., 5.50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isInserting}
              className="w-full rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {isInserting ? "Inserting..." : "Insert medication"}
            </button>
          </form>

          {/* Insert Result Display */}
          {insertResult && (
            <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
              <p className="font-semibold">Success!</p>
              <p>{insertResult.message}</p>
              <p className="mt-1 text-sm">
                Medication ID: {insertResult.insertId} | Affected rows:{" "}
                {insertResult.affectedRows}
              </p>
            </div>
          )}
        </div>

        {/* Fetch Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Fetch all medications (test read operation)
            </h2>
            <button
              onClick={handleFetch}
              disabled={isFetching}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              {isFetching ? "Loading..." : "Fetch medications"}
            </button>
          </div>

          {/* Fetch Result Display */}
          {fetchResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <p className="font-semibold">Success!</p>
                <p>
                  {fetchResult.message} | Found {fetchResult.count} medication
                  {fetchResult.count !== 1 ? "s" : ""}
                </p>
              </div>

              {fetchResult.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800">
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          ID
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Name
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Description
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Stock
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Price
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Created at
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetchResult.data.map((medication) => (
                        <tr
                          key={medication.medication_id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                            {medication.medication_id}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm font-medium text-black dark:border-zinc-700 dark:text-zinc-50">
                            {medication.name}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                            {medication.description ?? (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                            {medication.stock_quantity}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                            ${Number(medication.unit_price).toFixed(2)}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50">
                            {new Date(medication.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  No medications found in the database.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

