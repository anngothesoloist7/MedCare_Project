-- Get patient information by NID number
-- This query retrieves patient information from the users table
-- Used by doctors to look up patient details when creating a diagnosis
--
-- Parameters:
-- ? = nid_number (VARCHAR) - The national ID number to look up
--
-- Returns:
-- Patient record with user_id, nid_number, phone, dob, role
-- Empty array if patient not found
--
-- Note: The patient must have role = 'Patient'

SELECT 
    user_id,
    nid_number,
    phone,
    dob,
    role
FROM users
WHERE nid_number = ?
    AND role = 'Patient';

