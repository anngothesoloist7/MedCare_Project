-- UPDATE USER
-- This mutation updates optional user fields (nid_number, phone, role, dob) for an existing user
-- Used during the user onboarding process to complete user profile information
--
-- Parameters:
-- ? = nid_number (INT) - National ID number (optional, can be NULL)
-- ? = phone (VARCHAR) - Phone number (optional, can be NULL)
-- ? = role (ENUM) - User role: 'Admin', 'Doctor', or 'Patient' (optional, can be NULL)
-- ? = dob (DATE) - Date of birth (optional, can be NULL)
-- ? = user_id (VARCHAR) - User ID to identify which user to update (required)
--
-- Note: Only the provided fields will be updated. NULL values are allowed for all optional fields.
-- The updated_at timestamp is automatically updated by the database due to ON UPDATE CURRENT_TIMESTAMP.
UPDATE users
SET 
    nid_number = ?,
    phone = ?,
    role = ?,
    dob = ?
WHERE user_id = ?;

