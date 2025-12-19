-- INSERT PATIENT
-- This mutation inserts a new patient record into the patients table
-- Used during the user onboarding process when a user selects "Patient" role
--
-- Parameters:
-- ? = patient_id (VARCHAR) - User ID that references users.user_id (required)
-- ? = age (INT) - Age of the patient (required)
-- ? = height (DECIMAL) - Height of the patient in meters (required, e.g., 1.75)
-- ? = gender (ENUM) - Gender: 'male', 'female', or 'other' (required)
--
-- Note: The patient_id must already exist in the users table due to foreign key constraint.
-- This mutation is called after updating the users table with role='Patient' during onboarding.
INSERT INTO patients (patient_id, age, height, gender)
VALUES (?, ?, ?, ?);
