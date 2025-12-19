-- Get patient information by NID number
-- This query retrieves patient information from the users table
-- Used by doctors to look up patient details when creating a diagnosis
--
-- Parameters:
-- ? = nid_number (VARCHAR) - The national ID number to look up
--
-- Returns:
-- Patient record with user_id, nid_number, phone, dob, role, age, height, gender
-- Empty array if patient not found
--
-- Note: All patient information (age, height, gender) is stored directly in the users table
-- The patient must have role = 'Patient'

SELECT 
    user_id,
    nid_number,
    phone,
    dob,
    role,
    age,
    height,
    gender
FROM users
WHERE nid_number = ?
    AND role = 'Patient';

