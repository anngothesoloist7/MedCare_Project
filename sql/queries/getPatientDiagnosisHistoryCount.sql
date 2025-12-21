-- Get total count of diagnoses for a specific patient
-- This query counts all diagnoses for a patient
-- Used for pagination calculation in user dashboard and history query
--
-- Parameters:
-- ? = patient_id (VARCHAR) - The patient's user_id (Clerk ID)
--
-- Returns:
-- Single row with count of total diagnoses for the patient

SELECT COUNT(*) as total
FROM diagnosis d
WHERE d.patient_id = ?;

