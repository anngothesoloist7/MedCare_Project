-- ============================================================
-- View: vw_PatientDiagnosisHistory
-- ============================================================
-- Purpose: Shows diagnosis history for patients with all relevant fields
-- This view simplifies the getPatientDiagnosisHistory.sql query
--
-- Why this view exists:
-- Provides a reusable view for patient diagnosis history queries.
-- The ordering (by date DESC) is built into the view, so consumers
-- only need to filter by patient_id and apply pagination.
-- This is used by both patients viewing their own history and
-- doctors viewing a specific patient's history.
--
-- Columns:
-- - diagnosis_id: Primary key (INT)
-- - patient_id: Foreign key to users table - the patient (VARCHAR)
-- - doctor_id: Foreign key to users table - the treating doctor (VARCHAR)
-- - date: Date of the diagnosis/consultation (DATE)
-- - diagnosis: The diagnosis text/summary (VARCHAR)
-- - next_checkup: Scheduled next visit date, nullable (DATE)
-- - created_at: Record creation timestamp
-- - updated_at: Record last update timestamp
--
-- Usage:
-- SELECT * FROM vw_PatientDiagnosisHistory WHERE patient_id = ? LIMIT ?, ?;
-- This returns paginated diagnosis history for a specific patient
--
-- Connected to:
-- - diagnosis table (source data)
-- - Used by: GET /api/dashboard/user and GET /api/history/patient endpoints
-- ============================================================

CREATE VIEW vw_PatientDiagnosisHistory AS
SELECT 
    d.diagnosis_id,
    d.patient_id,
    d.doctor_id,
    d.date,
    d.diagnosis,
    d.next_checkup,
    d.created_at,
    d.updated_at
FROM diagnosis d
ORDER BY d.date DESC;
