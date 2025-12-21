-- ============================================================
-- View: vw_PrescriptionDetails
-- ============================================================
-- Purpose: Shows prescription item details with medication name
-- This view replaces the direct query in getPrescriptionItemsByDiagnosis.sql
--
-- Why this view exists:
-- The prescription_item table only stores medication_id (foreign key).
-- This view pre-joins with medications table to include the medication name,
-- which is needed by the frontend to display prescription details.
-- Using a view avoids repeating the JOIN logic in multiple places.
--
-- Columns:
-- - prescription_item_id: Primary key (INT)
-- - diagnosis_id: Foreign key to diagnosis table (INT)
-- - medication_id: Foreign key to medications table (INT)
-- - medication_name: Medication name from joined medications table (VARCHAR)
-- - quantity: Number of units prescribed (INT)
-- - guide: Instructions for taking the medication (VARCHAR)
-- - duration: How long to take the medication (VARCHAR)
-- - created_at: Record creation timestamp
-- - updated_at: Record last update timestamp
--
-- Usage:
-- SELECT * FROM vw_PrescriptionDetails WHERE diagnosis_id = ?;
-- This returns all prescription items for a specific diagnosis
--
-- Connected to:
-- - prescription_item table (base prescription data)
-- - medications table (medication name lookup)
-- - Used by: GET /api/diagnosis/[id] endpoint
-- ============================================================

CREATE VIEW vw_PrescriptionDetails AS
SELECT 
    pi.prescription_item_id,
    pi.diagnosis_id,
    pi.medication_id,
    m.name AS medication_name,
    pi.quantity,
    pi.guide,
    pi.duration,
    pi.created_at,
    pi.updated_at
FROM prescription_item pi
JOIN medications m ON pi.medication_id = m.medication_id;