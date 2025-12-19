-- INSERT DOCTOR
-- This mutation inserts a new doctor record into the doctors table
-- Used during the user onboarding process when a user selects "Doctor" role
--
-- Parameters:
-- ? = doctor_id (VARCHAR) - User ID that references users.user_id (required)
-- ? = speciality (VARCHAR) - Medical speciality of the doctor (required)
--
-- Note: The doctor_id must already exist in the users table due to foreign key constraint.
-- This mutation is called after updating the users table with role='Doctor' during onboarding.
INSERT INTO doctors (doctor_id, speciality)
VALUES (?, ?);
