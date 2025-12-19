-- UPDATE USER ONBOARDING
-- This mutation updates all user fields during the onboarding process
-- It includes common fields (nid_number, phone, role, dob) and role-specific fields
-- (speciality for doctors, age/height/gender for patients)
--
-- Parameters:
-- ? = nid_number (VARCHAR) - National ID number (required)
-- ? = phone (VARCHAR) - Phone number (required)
-- ? = role (ENUM) - User role: 'Admin', 'Doctor', or 'Patient' (required)
-- ? = dob (DATE) - Date of birth (required)
-- ? = speciality (VARCHAR) - Medical speciality (required for Doctor, NULL for Patient)
-- ? = age (INT) - Age (required for Patient, NULL for Doctor)
-- ? = height (DECIMAL) - Height in meters (required for Patient, NULL for Doctor)
-- ? = gender (ENUM) - Gender: 'male', 'female', or 'other' (required for Patient, NULL for Doctor)
-- ? = user_id (VARCHAR) - User ID to identify which user to update (required)
--
-- Note: Role-specific fields are set to NULL for the role that doesn't use them.
-- For example, if role is 'Doctor', age, height, and gender will be NULL.
-- If role is 'Patient', speciality will be NULL.
UPDATE users
SET 
    nid_number = ?,
    phone = ?,
    role = ?,
    dob = ?,
    speciality = ?,
    age = ?,
    height = ?,
    gender = ?
WHERE user_id = ?;
