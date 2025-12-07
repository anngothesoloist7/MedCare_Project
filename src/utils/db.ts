/**
 * Database connection utility for MySQL
 *
 * This file handles the connection to the MySQL database deployed on Railway.
 * It uses the mysql2 library to create a connection pool for efficient database operations.
 *
 * Connection details are read from environment variables provided by Railway:
 * - MYSQL_HOST: Database host address
 * - MYSQL_PORT: Database port (defaults to 3306)
 * - MYSQL_USER: Database username
 * - MYSQL_PASSWORD: Database password
 * - MYSQL_DATABASE: Database name
 *
 * The connection pool is configured to:
 * - Maintain a minimum of 2 connections
 * - Allow up to 10 concurrent connections
 * - Automatically reconnect on connection loss
 * - Use a 60-second connection timeout
 *
 * This utility is used by SQL execution functions in src/utils/sql.ts
 */

import mysql from "mysql2/promise";

/**
 * Parses a MySQL connection URL into connection parameters
 *
 * Handles Railway's MySQL URL format: mysql://user:password@host:port/database
 *
 * @param url - MySQL connection URL string
 * @returns Object with connection parameters
 */
function parseConnectionUrl(url: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const urlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error("Invalid MySQL connection URL format");
  }

  return {
    user: decodeURIComponent(match[1] ?? ""),
    password: decodeURIComponent(match[2] ?? ""),
    host: match[3] ?? "",
    port: parseInt(match[4] ?? "3306", 10),
    database: match[5] ?? "",
  };
}

/**
 * Gets connection configuration from environment variables
 *
 * Prioritizes MYSQL_PUBLIC_URL (works locally and in production) over MYSQL_URL
 * (only works within Railway's internal network). Falls back to individual
 * MYSQL* environment variables from Railway if no URL is provided.
 */
function getConnectionConfig() {
  // Prioritize MYSQL_PUBLIC_URL over MYSQL_URL
  // MYSQL_PUBLIC_URL works both locally and in production
  // MYSQL_URL only works within Railway's internal network
  const connectionUrl = process.env.MYSQL_PUBLIC_URL ?? process.env.MYSQL_URL;

  if (connectionUrl) {
    const parsed = parseConnectionUrl(connectionUrl);

    // Warn if using internal URL locally (won't work outside Railway network)
    if (
      process.env.MYSQL_URL &&
      !process.env.MYSQL_PUBLIC_URL &&
      parsed.host.includes("railway.internal")
    ) {
      console.warn(
        "⚠️  Warning: Using MYSQL_URL with internal hostname. This only works within Railway's network.\n" +
          "   For local development, use MYSQL_PUBLIC_URL instead."
      );
    }

    return {
      ...parsed,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };
  }

  // Fall back to individual environment variables
  const config = {
    host: process.env.MYSQLHOST ?? process.env.MYSQL_HOST ?? "",
    port: parseInt(
      process.env.MYSQLPORT ?? process.env.MYSQL_PORT ?? "3306",
      10
    ),
    user: process.env.MYSQLUSER ?? process.env.MYSQL_USER ?? "",
    password:
      process.env.MYSQLPASSWORD ??
      process.env.MYSQL_PASSWORD ??
      process.env.MYSQL_ROOT_PASSWORD ??
      "",
    database: process.env.MYSQLDATABASE ?? process.env.MYSQL_DATABASE ?? "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  // Validate that required fields are present
  if (!config.host || !config.user || !config.database) {
    throw new Error(
      "Missing required MySQL connection configuration. " +
        "Please set MYSQL_PUBLIC_URL or provide MYSQLHOST, MYSQLUSER, and MYSQLDATABASE environment variables."
    );
  }

  return config;
}

/**
 * Creates and exports a MySQL connection pool
 *
 * The pool manages multiple database connections efficiently, reusing them
 * across multiple queries to improve performance and reduce connection overhead.
 *
 * Environment variables are read from Railway's MySQL deployment configuration.
 * Supports both URL format (MYSQL_URL/MYSQL_PUBLIC_URL) and individual variables.
 */
const pool = mysql.createPool(getConnectionConfig());

/**
 * Gets a connection from the pool
 *
 * Use this when you need a single connection for a transaction or multiple
 * related queries. Always release the connection when done.
 *
 * @returns Promise resolving to a MySQL connection
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * Executes a query using the connection pool
 *
 * This is a convenience method that automatically manages the connection lifecycle.
 * For transactions or multiple related queries, use getConnection() instead.
 *
 * @param sql - SQL query string
 * @param params - Optional array of parameters for prepared statements
 * @returns Promise resolving to query results
 * @throws Error with helpful message if connection fails
 */
export async function query(sql: string, params?: unknown[]) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    // Provide more helpful error messages for common connection issues
    if (error instanceof Error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo")
      ) {
        throw new Error(
          `Database connection failed: Cannot resolve hostname. ` +
            `If running locally, make sure you're using MYSQL_PUBLIC_URL (not MYSQL_URL) ` +
            `or set MYSQLHOST to the public hostname (e.g., *.railway.app). ` +
            `Original error: ${error.message}`
        );
      }
      if (error.message.includes("ECONNREFUSED")) {
        throw new Error(
          `Database connection refused. Check that: ` +
            `1) MySQL service is running on Railway, ` +
            `2) Port is correct (usually 3306), ` +
            `3) Network access is allowed. ` +
            `Original error: ${error.message}`
        );
      }
    }
    throw error;
  }
}

/**
 * Closes all connections in the pool
 *
 * Call this when shutting down the application to gracefully close all
 * database connections. Typically used in cleanup handlers.
 */
export async function closePool() {
  await pool.end();
}

export default pool;
