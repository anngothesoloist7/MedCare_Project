-- Example SELECT query
-- This file demonstrates how to write SQL queries that will be executed from TypeScript
-- Use ? placeholders for parameters to prevent SQL injection

-- Example: Get user by ID
-- Usage in TypeScript: executeQuery('queries/example.sql', [userId])
SELECT 
  user_id,
  full_name,
  email,
  role,
  created_at
FROM users
WHERE user_id = ?;



