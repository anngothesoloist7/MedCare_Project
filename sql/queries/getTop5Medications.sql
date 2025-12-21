-- ============================================================
-- Query: getTop5Medications.sql
-- ============================================================
-- Purpose: Get top 5 medications by prescription usage count
-- This query now uses the vw_MedicationPopularity view
--
-- Why using a view:
-- Instead of repeating the JOIN + GROUP BY logic here,
-- we query the vw_MedicationPopularity view which already has
-- the aggregation built in. This provides:
-- 1. Better maintainability - change aggregation logic in one place
-- 2. Consistency - all medication popularity queries use same logic
-- 3. Cleaner code - the query is simple and readable
--
-- The view already orders by usage_count DESC, so we just LIMIT 5
--
-- Parameters: None
--
-- Returns:
-- - medication_id: Primary key (INT)
-- - name: Medication name (VARCHAR)
-- - usage_count: Number of times prescribed (BIGINT)
--
-- Connected to:
-- - vw_MedicationPopularity view (source data)
-- - Used by: GET /api/medications/top-5 endpoint
-- ============================================================

SELECT 
    medication_id,
    name,
    usage_count
FROM vw_MedicationPopularity
LIMIT 5;
