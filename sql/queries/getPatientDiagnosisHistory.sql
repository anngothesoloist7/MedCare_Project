-- ============================================================
-- Query: getPatientDiagnosisHistory.sql
-- ============================================================
-- Purpose: Get diagnosis history for a specific patient with pagination
-- This query now uses the vw_PatientDiagnosisHistory view
--
-- Why using a view:
-- Instead of querying the diagnosis table directly,
-- we query the vw_PatientDiagnosisHistory view which already has
-- the ordering built in. This provides:
-- 1. Better maintainability - change query logic in one place
-- 2. Consistency - all patient history queries use same logic
-- 3. Cleaner code - the query is simple and readable
--
-- The view already orders by date DESC (most recent first)
--
-- Parameters:
-- ? = patient_id (VARCHAR) - The patient's user_id (Clerk ID)
-- ? = offset (INT) - Number of records to skip (for pagination)
-- ? = limit (INT) - Number of records to return (for pagination)
-- Note: LIMIT uses offset, limit syntax (not LIMIT limit OFFSET offset)
--
-- Returns:
-- - diagnosis_id: Primary key (INT)
-- - doctor_id: The treating doctor's user_id (VARCHAR)
-- - date: Date of the diagnosis (DATE)
-- - diagnosis: The diagnosis text/summary (VARCHAR)
-- - next_checkup: Scheduled next visit date, nullable (DATE)
--
-- Connected to:
-- - vw_PatientDiagnosisHistory view (source data)
-- - Used by: GET /api/dashboard/user and GET /api/history/patient endpoints
-- ============================================================

SELECT 
    diagnosis_id,
    doctor_id,
    date,
    diagnosis,
    next_checkup
FROM vw_PatientDiagnosisHistory
WHERE patient_id = ?
LIMIT ?, ?;
