-- ============================================================
-- Query: getPrescriptionItemsByDiagnosis.sql
-- ============================================================
-- Purpose: Get prescription items for a specific diagnosis
-- This query now uses the vw_PrescriptionDetails view
--
-- Why using a view:
-- Instead of repeating the JOIN logic with medications table here,
-- we query the vw_PrescriptionDetails view which already has
-- the medication name lookup built in. This provides:
-- 1. Better maintainability - change join logic in one place
-- 2. Consistency - all prescription queries use same logic
-- 3. Cleaner code - the query is simple and readable
--
-- Parameters:
-- ? = diagnosis_id (INT) - The diagnosis ID to retrieve prescription items for
--
-- Returns:
-- - prescription_item_id: Primary key (INT)
-- - medication_id: Foreign key to medications (INT)
-- - medication_name: Name of the medication (VARCHAR)
-- - quantity: Number of units prescribed (INT)
-- - guide: Instructions for taking the medication (VARCHAR)
-- - duration: How long to take the medication (VARCHAR)
--
-- Connected to:
-- - vw_PrescriptionDetails view (source data)
-- - Used by: GET /api/diagnosis/[id] endpoint
-- ============================================================

SELECT 
    prescription_item_id,
    medication_id,
    medication_name,
    quantity,
    guide,
    duration
FROM vw_PrescriptionDetails
WHERE diagnosis_id = ?
ORDER BY prescription_item_id;
