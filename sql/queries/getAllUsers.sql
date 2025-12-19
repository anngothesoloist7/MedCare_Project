-- GET ALL USERS
-- This query retrieves all users from the users table
-- Used by the user management UI to display all users
-- Returns all columns: user_id, nid_number, phone, role, dob, created_at, updated_at
SELECT 
    user_id,
    nid_number,
    phone,
    role,
    dob,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC;
