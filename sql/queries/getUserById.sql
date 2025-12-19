-- Get user by user_id (Clerk ID)
-- This query is used to check if a user exists in the database
-- before creating or updating user records from Clerk webhooks
--
-- Parameters:
-- ? = user_id (VARCHAR) - The Clerk user ID to look up
--
-- Returns:
-- Single user record if found, empty array if not found
SELECT user_id, nid_number, phone, role, dob, created_at, updated_at
FROM users
WHERE user_id = ?;

