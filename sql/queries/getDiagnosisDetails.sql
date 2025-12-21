-- Get full diagnosis details with prescription items
-- This query retrieves complete diagnosis information and all associated prescription items
-- Used by diagnosis detail dialog to show full diagnosis and prescriptions
--
-- Parameters:
-- ? = diagnosis_id (INT) - The diagnosis ID to retrieve
--
-- Returns:
-- Diagnosis details: diagnosis_id, doctor_id, patient_id, date, diagnosis, next_checkup
-- Note: Prescription items are fetched separately via getPrescriptionItemsByDiagnosis.sql

SELECT 
    d.diagnosis_id,
    d.doctor_id,
    d.patient_id,
    d.date,
    d.diagnosis,
    d.next_checkup,
    d.created_at,
    d.updated_at
FROM diagnosis d
WHERE d.diagnosis_id = ?;


