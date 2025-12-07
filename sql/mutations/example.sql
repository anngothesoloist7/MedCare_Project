-- Example INSERT mutation
-- This file demonstrates how to write SQL mutations that will be executed from TypeScript
-- Use ? placeholders for parameters to prevent SQL injection

-- Example: Create a new user
-- Usage in TypeScript: executeMutation('mutations/example.sql', [fullName, email, passwordHash, role])
INSERT INTO users (
  full_name,
  email,
  password_hash,
  role,
  created_at
) VALUES (
  ?,
  ?,
  ?,
  ?,
  NOW()
);



