-- INSERT USER
-- This mutation inserts a new user into the users table
-- Parameters: user_id
-- Used by the user management UI to create new users
--
-- Note: nid_number, phone, role, and dob are optional fields that will be updated later
-- during the user onboarding process. They are not included in the initial user creation.
INSERT INTO users (user_id)
VALUES (?);
