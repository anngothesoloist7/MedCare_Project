-- ============================================================
-- View: vw_DoctorPatientVisits
-- ============================================================
-- Purpose: Shows patient visits for doctors with all relevant fields
-- This view simplifies the getDoctorPatientVisits.sql query
--
-- Why this view exists:
-- Provides a reusable view for doctor patient visit queries.
-- The ordering (by date DESC) is built into the view, so consumers
-- only need to filter by doctor_id and apply pagination.
-- This is used by the doctor dashboard to show their patient visits.
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
-- SELECT * FROM vw_DoctorPatientVisits WHERE doctor_id = ? LIMIT ?, ?;
-- This returns paginated patient visits for a specific doctor
--
-- Connected to:
-- - diagnosis table (source data)
-- - Used by: GET /api/dashboard/doctor endpoint
-- ============================================================

CREATE VIEW vw_DoctorPatientVisits AS
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
