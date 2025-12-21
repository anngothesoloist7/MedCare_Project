-- Get total count of patient visits for a specific doctor
-- This query counts all diagnoses created by a doctor
-- Used for pagination calculation in doctor dashboard
--
-- Parameters:
-- ? = doctor_id (VARCHAR) - The doctor's user_id (Clerk ID)
--
-- Returns:
-- Single row with count of total diagnoses for the doctor

SELECT COUNT(*) as total
FROM diagnosis d
WHERE d.doctor_id = ?;


