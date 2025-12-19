-- Get user by nid_number
-- This query is used to check if a national ID number is already in use
-- Returns user record if found, empty array if not found
--
-- Parameters:
-- ? = nid_number (VARCHAR) - The national ID number to look up
--
-- Returns:
-- Single user record if found, empty array if not found
SELECT user_id, nid_number, phone, role, dob, created_at, updated_at
FROM users
WHERE nid_number = ?;

