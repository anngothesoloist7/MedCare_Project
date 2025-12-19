-- Delete user by Clerk ID
-- This mutation removes a user record when Clerk sends a user.deleted event
-- Cascade deletion is handled by foreign key constraints in related tables (patients, doctors)
--
-- Parameters:
-- ? = user_id (VARCHAR) - The Clerk user ID to delete
--
-- Note: This will cascade delete related records in patients/doctors tables
-- due to foreign key constraints. Diagnosis and prescription records may need
-- separate handling depending on business requirements.
DELETE FROM users
WHERE user_id = ?;

