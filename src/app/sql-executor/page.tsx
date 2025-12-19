"use client";

/**
 * SQL Executor Page
 *
 * This page provides a UI to execute raw SQL queries directly against the database.
 * WARNING: This tool allows direct database access and should be used with caution.
 *
 * Features:
 * - SQL query editor with syntax highlighting (basic)
 * - Execute button to run queries
 * - Results display for SELECT queries
 * - Success/error messages for mutations
 * - Query history (stored in browser state)
 *
 * This page uses client-side React hooks to handle form submission and API calls.
 * The API endpoint is defined in src/app/api/sql-executor/route.ts
 */

import { useState } from "react";

/**
 * Type definition for SQL execution response
 */
type SqlResponse = {
  success: boolean;
  message: string;
  isSelectQuery?: boolean;
  results?: unknown[];
  rowCount?: number;
  affectedRows?: number;
  insertId?: number;
  error?: string;
  errorCode?: string;
};

export default function SqlExecutorPage() {
  // State for SQL query input
  // This stores the SQL query that the user types in the textarea
  const [sql, setSql] = useState("");
  const [params, setParams] = useState("");

  // State for API responses and loading states
  // These track the results of SQL execution and UI feedback
  const [response, setResponse] = useState<SqlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  /**
   * Handles SQL query execution
   *
   * This function:
   * 1. Validates the SQL query
   * 2. Parses optional parameters (JSON array)
   * 3. Sends a POST request to /api/sql-executor
   * 4. Updates the UI with the result or error
   */
  const handleExecute = async () => {
    if (!sql.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setError(null);
    setResponse(null);
    setIsExecuting(true);

    try {
      // Parse params if provided (expects JSON array format)
      let parsedParams: unknown[] | undefined;
      if (params.trim()) {
        try {
          parsedParams = JSON.parse(params);
          if (!Array.isArray(parsedParams)) {
            throw new Error("Params must be a JSON array");
          }
        } catch (parseError) {
          throw new Error(
            `Invalid params format: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }. Expected JSON array format, e.g., ["value1", 123]`
          );
        }
      }

      // Send POST request to the API route
      const apiResponse = await fetch("/api/sql-executor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: sql.trim(),
          params: parsedParams,
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        // Handle API errors (SQL syntax errors, connection issues, etc.)
        throw new Error(data.message ?? data.error ?? "Failed to execute SQL");
      }

      // Success - update state with the result
      setResponse(data);

      // Add to query history (keep last 10 queries)
      setQueryHistory((prev) => {
        const newHistory = [
          sql.trim(),
          ...prev.filter((q) => q !== sql.trim()),
        ];
        return newHistory.slice(0, 10);
      });
    } catch (err) {
      // Handle network errors or API errors
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Handles loading a query from history
   */
  const handleLoadHistory = (query: string) => {
    setSql(query);
    setError(null);
    setResponse(null);
  };

  /**
   * Handles clearing the SQL editor
   */
  const handleClear = () => {
    setSql("");
    setParams("");
    setError(null);
    setResponse(null);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-6xl space-y-6">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            SQL executor
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Execute raw SQL queries against the database
          </p>
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <p className="font-semibold">⚠️ Warning:</p>
            <p className="text-sm">
              This tool allows direct database access. Use with caution. Always
              verify your SQL queries before executing.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold">Error:</p>
            <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-50">
              Query history
            </h3>
            <div className="flex flex-wrap gap-2">
              {queryHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleLoadHistory(query)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                  title={query}
                >
                  {query.substring(0, 50)}
                  {query.length > 50 ? "..." : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SQL Editor Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              SQL query
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
              >
                Clear
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || !sql.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isExecuting ? "Executing..." : "Execute"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="sql"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                SQL query *
              </label>
              <textarea
                id="sql"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="SELECT * FROM users LIMIT 10;"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                rows={10}
                spellCheck={false}
              />
            </div>

            <div>
              <label
                htmlFor="params"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Parameters (optional) - JSON array format
              </label>
              <textarea
                id="params"
                value={params}
                onChange={(e) => setParams(e.target.value)}
                placeholder='["value1", 123, "value3"]'
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                rows={3}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Results Display Section */}
        {response && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Results
            </h2>

            {/* Success Message */}
            <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
              <p className="font-semibold">✅ {response.message}</p>
              {response.isSelectQuery && response.rowCount !== undefined && (
                <p className="mt-1 text-sm">
                  Returned {response.rowCount} row
                  {response.rowCount !== 1 ? "s" : ""}
                </p>
              )}
              {response.affectedRows !== undefined && (
                <p className="mt-1 text-sm">
                  Affected rows: {response.affectedRows}
                </p>
              )}
              {response.insertId !== undefined && (
                <p className="mt-1 text-sm">Insert ID: {response.insertId}</p>
              )}
            </div>

            {/* Results Table (for SELECT queries) */}
            {response.isSelectQuery &&
              response.results &&
              response.results.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800">
                        {Object.keys(response.results[0] as object).map(
                          (key) => (
                            <th
                              key={key}
                              className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50"
                            >
                              {key}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {response.results.map((row, index) => (
                        <tr
                          key={index}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          {Object.values(row as object).map(
                            (value, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="border border-zinc-300 px-4 py-2 text-sm text-black dark:border-zinc-700 dark:text-zinc-50"
                              >
                                {value === null || value === undefined ? (
                                  <span className="text-zinc-400">NULL</span>
                                ) : typeof value === "object" ? (
                                  JSON.stringify(value)
                                ) : (
                                  String(value)
                                )}
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Empty Results */}
            {response.isSelectQuery &&
              response.results &&
              response.results.length === 0 && (
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  Query executed successfully but returned no rows.
                </p>
              )}

            {/* Raw Results JSON (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400">
                View raw JSON response
              </summary>
              <pre className="mt-2 overflow-auto rounded-md border border-zinc-300 bg-zinc-50 p-4 text-xs dark:border-zinc-700 dark:bg-zinc-800">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
