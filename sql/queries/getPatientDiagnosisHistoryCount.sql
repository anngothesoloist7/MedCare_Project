-- ============================================================
-- Query: getPatientDiagnosisHistoryCount.sql
-- ============================================================
-- Purpose: Get total count of diagnoses for a specific patient
-- This query uses the vw_PatientDiagnosisHistory view for consistency
--
-- Why using a view:
-- Using the same view as the main query ensures consistency
-- If the view definition changes, the count will still match the data
--
-- Parameters:
-- ? = patient_id (VARCHAR) - The patient's user_id (Clerk ID)
--
-- Returns:
-- - total: Count of diagnoses for the patient (BIGINT)
--
-- Connected to:
-- - vw_PatientDiagnosisHistory view (source data)
-- - Used by: GET /api/dashboard/user and GET /api/history/patient endpoints
-- ============================================================

SELECT COUNT(*) as total
FROM vw_PatientDiagnosisHistory
WHERE patient_id = ?;
