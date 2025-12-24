-- UPDATE USER ONBOARDING
-- This mutation updates all user fields during the onboarding process
-- It includes common fields (nid_number, phone, role, dob)
--
-- Parameters:
-- ? = nid_number (VARCHAR) - National ID number (required)
-- ? = phone (VARCHAR) - Phone number (required)
-- ? = role (ENUM) - User role: 'Doctor', or 'Patient' (required)
-- ? = dob (DATE) - Date of birth (required)
-- ? = user_id (VARCHAR) - User ID to identify which user to update (required)
--
UPDATE users
SET 
    nid_number = ?,
    phone = ?,
    role = ?,
    dob = ?
WHERE user_id = ?;
