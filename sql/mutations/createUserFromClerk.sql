-- Create user from Clerk webhook event
-- This mutation inserts a new user record when Clerk sends a user.created event
-- The user_id is set to the Clerk user ID to maintain consistency between Clerk and our database
--
-- Parameters:
-- ? = user_id (VARCHAR) - Clerk user ID (used as primary key)
--
-- Note: nid_number, phone, role, and dob are optional fields that will be updated later
-- during the user onboarding process. They are not included in the initial user creation.
INSERT INTO users (user_id)
VALUES (?);

