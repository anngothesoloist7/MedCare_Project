/**
 * SQL execution utilities
 *
 * This file provides utilities for executing SQL queries stored in separate .sql files.
 * This separation allows team members to work on SQL code independently without conflicts
 * with TypeScript/TSX code.
 *
 * SQL files are stored in the /sql directory at the project root:
 * - /sql/queries/ - For SELECT queries (read operations)
 * - /sql/mutations/ - For INSERT, UPDATE, DELETE operations (write operations)
 * - /sql/procedures/ - For stored procedures
 * - /sql/schema/ - For DDL statements (CREATE, ALTER, DROP)
 *
 * Usage:
 * - executeQuery('queries/getUserById.sql', [userId]) - For SELECT queries
 * - executeMutation('mutations/createUser.sql', [name, email]) - For INSERT/UPDATE/DELETE
 * - executeProcedure('procedures/sp_IssuePrescriptionItem.sql', [params]) - For stored procedures
 */

import { readFile } from "fs/promises";
import { join } from "path";
import { query, getConnection } from "./db";

/**
 * Base directory for SQL files
 * SQL files are stored separately from TypeScript code to avoid merge conflicts
 */
const SQL_DIR = join(process.cwd(), "sql");

/**
 * Reads a SQL file from the sql directory
 *
 * @param filePath - Relative path from the sql directory (e.g., 'queries/getUserById.sql')
 * @returns Promise resolving to the SQL query string
 * @throws Error if the file cannot be read
 */
async function readSqlFile(filePath: string): Promise<string> {
  const fullPath = join(SQL_DIR, filePath);
  try {
    const sql = await readFile(fullPath, "utf-8");
    return sql.trim();
  } catch (error) {
    throw new Error(
      `Failed to read SQL file at ${fullPath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Executes a SELECT query from a SQL file
 *
 * Use this for read operations (SELECT queries). The SQL file should contain
 * a SELECT statement with optional parameter placeholders (?).
 *
 * @param filePath - Relative path from sql directory (e.g., 'queries/getUserById.sql')
 * @param params - Optional array of parameters for prepared statements
 * @returns Promise resolving to query results (array of rows)
 *
 * @example
 * ```typescript
 * const users = await executeQuery('queries/getUserById.sql', [userId]);
 * ```
 */
export async function executeQuery<T = unknown>(
  filePath: string,
  params?: unknown[]
): Promise<T[]> {
  console.log(`📄 [SQL Query] Reading SQL file: ${filePath}`);
  const sql = await readSqlFile(filePath);
  console.log(`✅ [SQL Query] SQL file read successfully`, {
    filePath,
    sqlLength: sql.length,
    paramsCount: params?.length ?? 0,
    paramsPreview:
      params
        ?.slice(0, 3)
        .map((p) => (typeof p === "string" ? p.substring(0, 50) : p)) ?? [],
  });

  console.log(`🔍 [SQL Query] Executing query via db.query()...`);
  const results = await query(sql, params);
  console.log(`✅ [SQL Query] Query execution completed`, {
    filePath,
    resultCount: Array.isArray(results) ? results.length : "N/A",
  });
  return results as T[];
}

/**
 * Executes a mutation query from a SQL file (INSERT, UPDATE, DELETE)
 *
 * Use this for write operations. The SQL file should contain an INSERT, UPDATE,
 * or DELETE statement with optional parameter placeholders (?).
 *
 * @param filePath - Relative path from sql directory (e.g., 'mutations/createUser.sql')
 * @param params - Optional array of parameters for prepared statements
 * @returns Promise resolving to the result object containing affectedRows and insertId
 *
 * @example
 * ```typescript
 * const result = await executeMutation('mutations/createUser.sql', [name, email]);
 * console.log(`Created user with ID: ${result.insertId}`);
 * ```
 */
export async function executeMutation(
  filePath: string,
  params?: unknown[]
): Promise<{
  affectedRows: number;
  insertId: number;
}> {
  console.log(`📄 [SQL Mutation] Reading SQL file: ${filePath}`);
  const sql = await readSqlFile(filePath);
  console.log(`✅ [SQL Mutation] SQL file read successfully`, {
    filePath,
    sqlLength: sql.length,
    paramsCount: params?.length ?? 0,
    paramsPreview:
      params
        ?.slice(0, 3)
        .map((p) => (typeof p === "string" ? p.substring(0, 50) : p)) ?? [],
  });

  console.log(`🔍 [SQL Mutation] Executing mutation via db.query()...`);
  const results = (await query(sql, params)) as {
    affectedRows: number;
    insertId: number;
  };
  console.log(`✅ [SQL Mutation] Mutation execution completed`, {
    filePath,
    affectedRows: results.affectedRows,
    insertId: results.insertId,
  });
  return results;
}

/**
 * Executes a stored procedure from a SQL file
 *
 * Use this for calling stored procedures. The SQL file should contain a CALL
 * statement with the procedure name and optional parameters.
 *
 * @param filePath - Relative path from sql directory (e.g., 'procedures/sp_IssuePrescriptionItem.sql')
 * @param params - Optional array of parameters for the stored procedure
 * @returns Promise resolving to the procedure results
 *
 * @example
 * ```typescript
 * const result = await executeProcedure('procedures/sp_IssuePrescriptionItem.sql', [diagnosisId, medicationId, quantity]);
 * ```
 */
export async function executeProcedure<T = unknown>(
  filePath: string,
  params?: unknown[]
): Promise<T[]> {
  const sql = await readSqlFile(filePath);
  const results = await query(sql, params);
  return results as T[];
}

/**
 * Executes multiple queries within a transaction
 *
 * Use this when you need to execute multiple related queries atomically.
 * If any query fails, all changes are rolled back.
 *
 * @param queries - Array of objects containing filePath and params for each query
 * @returns Promise resolving to an array of results for each query
 *
 * @example
 * ```typescript
 * const results = await executeTransaction([
 *   { filePath: 'mutations/createUser.sql', params: [name, email] },
 *   { filePath: 'mutations/createProfile.sql', params: [userId, bio] }
 * ]);
 * ```
 */
export async function executeTransaction(
  queries: Array<{ filePath: string; params?: unknown[] }>
): Promise<unknown[]> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const results: unknown[] = [];
    for (const { filePath, params } of queries) {
      const sql = await readSqlFile(filePath);
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Executes a DDL statement from a SQL file (CREATE, ALTER, DROP)
 *
 * Use this for schema changes like creating tables, indexes, or modifying table structure.
 * DDL statements don't return rows like SELECT queries, so this function handles them specially.
 *
 * @param filePath - Relative path from sql directory (e.g., 'schema/create_medications_table.sql')
 * @returns Promise resolving when the DDL statement completes successfully
 *
 * @example
 * ```typescript
 * await executeDDL('schema/create_medications_table.sql');
 * ```
 */
export async function executeDDL(filePath: string): Promise<void> {
  const sql = await readSqlFile(filePath);
  // Execute the DDL statement directly
  // Most DDL statements are single statements, and if there are multiple,
  // they should be in separate files for clarity
  await query(sql);
}

/**
 * Executes raw SQL string directly (use sparingly)
 *
 * Prefer using executeQuery, executeMutation, or executeProcedure with SQL files
 * instead of this function. This is only for dynamic SQL that cannot be stored
 * in files or for quick testing.
 *
 * @param sql - Raw SQL query string
 * @param params - Optional array of parameters for prepared statements
 * @returns Promise resolving to query results
 */
export async function executeRaw<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const results = await query(sql, params);
  return results as T[];
}
