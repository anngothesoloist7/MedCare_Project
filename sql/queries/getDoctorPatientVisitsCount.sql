-- ============================================================
-- Query: getDoctorPatientVisitsCount.sql
-- ============================================================
-- Purpose: Get total count of patient visits for a specific doctor
-- This query uses the vw_DoctorPatientVisits view for consistency
--
-- Why using a view:
-- Using the same view as the main query ensures consistency
-- If the view definition changes, the count will still match the data
--
-- Parameters:
-- ? = doctor_id (VARCHAR) - The doctor's user_id (Clerk ID)
--
-- Returns:
-- - total: Count of patient visits for the doctor (BIGINT)
--
-- Connected to:
-- - vw_DoctorPatientVisits view (source data)
-- - Used by: GET /api/dashboard/doctor endpoint
-- ============================================================

SELECT COUNT(*) as total
FROM vw_DoctorPatientVisits
WHERE doctor_id = ?;
