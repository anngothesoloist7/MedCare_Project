-- Get patient visits for a specific doctor with pagination
-- This query retrieves diagnoses created by a doctor, ordered by most recent first
-- Used by doctor dashboard to display patient visit history
--
-- Parameters:
-- ? = doctor_id (VARCHAR) - The doctor's user_id (Clerk ID)
-- ? = offset (INT) - Number of records to skip (for pagination)
-- ? = limit (INT) - Number of records to return (for pagination)
-- Note: LIMIT uses offset, limit syntax (not LIMIT limit OFFSET offset)
--
-- Returns:
-- Array of diagnosis records with: diagnosis_id, patient_id, date, diagnosis, next_checkup
-- Ordered by date DESC (most recent first)
-- Limited by pagination parameters

SELECT 
    d.diagnosis_id,
    d.patient_id,
    d.date,
    d.diagnosis,
    d.next_checkup
FROM diagnosis d
WHERE d.doctor_id = ?
ORDER BY d.date DESC
LIMIT ?, ?;

