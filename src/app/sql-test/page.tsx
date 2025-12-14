"use client";

/**
 * Comprehensive SQL Testing Page
 *
 * This page provides a UI to test all SQL operations in the MedCare database:
 * - Schema operations (DDL)
 * - Queries (SELECT)
 * - Mutations (INSERT, UPDATE, DELETE)
 * - Stored procedures
 * - Transactions
 */

import { useState, useEffect } from "react";

/**
 * Types for SQL operations
 */
type SQLOperation = "ddl" | "query" | "mutation" | "procedure" | "transaction";

type SQLResult = {
  success: boolean;
  operation?: SQLOperation;
  result?: any;
  error?: string;
  message?: string;
};

type SQLFiles = {
  schema: string[];
  queries: string[];
  mutations: string[];
  procedures: string[];
  triggers: string[];
  views: string[];
};

export default function SQLTestPage() {
  const [sqlFiles, setSqlFiles] = useState<SQLFiles | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [operation, setOperation] = useState<SQLOperation>("query");
  const [params, setParams] = useState<string>("");
  const [result, setResult] = useState<SQLResult | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available SQL files on component mount
  useEffect(() => {
    fetchSQLFiles();
  }, []);

  const fetchSQLFiles = async () => {
    try {
      const response = await fetch("/api/sql-test");
      const data = await response.json();
      if (data.success) {
        setSqlFiles(data.sqlFiles);
      }
    } catch (err) {
      console.error("Failed to fetch SQL files:", err);
    }
  };

  const executeOperation = async () => {
    if (!selectedFile) {
      setError("Please select a SQL file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let requestBody: any = {
        operation,
        filePath: selectedFile,
      };

      // Parse parameters if provided
      if (params.trim()) {
        try {
          requestBody.params = JSON.parse(`[${params}]`);
        } catch (e) {
          setError("Invalid parameters format. Use JSON array syntax, e.g., \"value1\", \"value2\"");
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/sql-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Operation failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const setupFullDatabase = async () => {
    setIsSettingUp(true);
    setError(null);
    setSetupResult(null);

    try {
      const response = await fetch("/api/setup-full-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ setupType: "full" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Setup failed");
      }

      setSetupResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsSettingUp(false);
    }
  };

  const getFileOptions = (category: keyof SQLFiles) => {
    if (!sqlFiles) return [];
    return sqlFiles[category].map(file => ({
      value: file,
      label: file.split('/').pop() || file
    }));
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            SQL Operations Test Suite
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Test all SQL queries, mutations, procedures, and DDL operations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Operation Configuration */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            Configure Operation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Operation Type
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as SQLOperation)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="query">Query (SELECT)</option>
                <option value="mutation">Mutation (INSERT/UPDATE/DELETE)</option>
                <option value="procedure">Stored Procedure</option>
                <option value="ddl">DDL (CREATE/ALTER/DROP)</option>
                <option value="transaction">Transaction</option>
              </select>
            </div>

            {/* SQL File Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                SQL File
              </label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="">Select a file...</option>
                {sqlFiles && (
                  <>
                    <optgroup label="Schema (DDL)">
                      {getFileOptions('schema').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Queries">
                      {getFileOptions('queries').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Mutations">
                      {getFileOptions('mutations').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Procedures">
                      {getFileOptions('procedures').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Triggers">
                      {getFileOptions('triggers').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Views">
                      {getFileOptions('views').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Parameters */}
          {operation !== 'ddl' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Parameters (JSON array format)
              </label>
              <input
                type="text"
                value={params}
                onChange={(e) => setParams(e.target.value)}
                placeholder='e.g., "value1", 123, "value2" or leave empty'
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Use JSON array syntax: "string", number, or null. Leave empty for no parameters.
              </p>
            </div>
          )}

          {/* Execute Button */}
          <div className="mt-6">
            <button
              onClick={executeOperation}
              disabled={isLoading || !selectedFile}
              className="w-full rounded-md bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {isLoading ? "Executing..." : `Execute ${operation.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setOperation('ddl');
                setSelectedFile('schema/create_tables.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Create Tables
            </button>
            <button
              onClick={() => {
                setOperation('ddl');
                setSelectedFile('schema/create_medications_table.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Create Medications Table
            </button>
            <button
              onClick={() => {
                setOperation('ddl');
                setSelectedFile('procedures/create_procedures.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Create Procedures
            </button>
            <button
              onClick={() => {
                setOperation('ddl');
                setSelectedFile('triggers/create_triggers.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Create Triggers
            </button>
            <button
              onClick={() => {
                setOperation('ddl');
                setSelectedFile('views/create_views.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Create Views
            </button>
            <button
              onClick={() => {
                setOperation('query');
                setSelectedFile('queries/rbac_setup.sql');
                setParams('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              Setup RBAC
            </button>
          </div>
        </div>

        {/* Full Database Setup */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                Full Database Setup
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Initialize the complete MedCare database with all tables, procedures, triggers, and views
              </p>
            </div>
            <button
              onClick={setupFullDatabase}
              disabled={isSettingUp}
              className="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {isSettingUp ? "Setting up..." : "Setup Full Database"}
            </button>
          </div>

          {/* Setup Result Display */}
          {setupResult && (
            <div className="mt-4 space-y-4">
              <div className={`rounded-lg border p-4 ${
                setupResult.success
                  ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}>
                <p className="font-semibold">
                  {setupResult.success ? "Setup Completed!" : "Setup Partially Completed"}
                </p>
                <p>{setupResult.message}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-black dark:text-zinc-50">Detailed Results:</h3>
                {setupResult.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${
                      result.success
                        ? "border-green-200 bg-green-25 text-green-700 dark:border-green-800 dark:bg-green-900/10 dark:text-green-300"
                        : "border-red-200 bg-red-25 text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.operation}</span>
                      <span className={`text-sm ${result.success ? "text-green-600" : "text-red-600"}`}>
                        {result.success ? "✓" : "✗"}
                      </span>
                    </div>
                    {result.message && (
                      <p className="text-sm mt-1">{result.message}</p>
                    )}
                    {result.error && (
                      <p className="text-sm mt-1 text-red-600 dark:text-red-400">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result Display */}
        {result && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Operation Result
            </h2>

            {result.success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <p className="font-semibold">Success!</p>
                  <p>{result.message || `${result.operation?.toUpperCase()} operation completed`}</p>
                </div>

                {result.result && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-black dark:text-zinc-50">Result Data:</h3>
                    <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                      <pre className="text-sm text-black dark:text-zinc-50 overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                <p className="font-semibold">Error:</p>
                <p>{result.error || result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}