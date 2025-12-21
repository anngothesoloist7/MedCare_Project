-- Get diagnosis history for a specific patient with pagination
-- This query retrieves all diagnoses for a patient, ordered by most recent first
-- Used by user dashboard and history query popup
--
-- Parameters:
-- ? = patient_id (VARCHAR) - The patient's user_id (Clerk ID)
-- ? = offset (INT) - Number of records to skip (for pagination)
-- ? = limit (INT) - Number of records to return (for pagination)
-- Note: LIMIT uses offset, limit syntax (not LIMIT limit OFFSET offset)
--
-- Returns:
-- Array of diagnosis records with: diagnosis_id, doctor_id, date, diagnosis, next_checkup
-- Ordered by date DESC (most recent first)
-- Limited by pagination parameters

SELECT 
    d.diagnosis_id,
    d.doctor_id,
    d.date,
    d.diagnosis,
    d.next_checkup
FROM diagnosis d
WHERE d.patient_id = ?
ORDER BY d.date DESC
LIMIT ?, ?;

