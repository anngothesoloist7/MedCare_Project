-- ============================================================
-- View: vw_MedicationPopularity
-- ============================================================
-- Purpose: Aggregates prescription usage to show medications by usage count
-- This view replaces the direct query in getTop5Medications.sql
-- 
-- Why this view exists:
-- Instead of running a complex JOIN + GROUP BY query every time,
-- we use a view for better abstraction and maintainability.
-- The view pre-defines the aggregation logic, making it easy to
-- query top medications without repeating the same SQL.
--
-- Columns:
-- - medication_id: Primary key from medications table (INT)
-- - name: Medication name (VARCHAR)
-- - stock_quantity: Current stock level (INT)
-- - unit_price: Price per unit (DECIMAL 10,2)
-- - usage_count: Number of times prescribed (COUNT of prescription_items)
--
-- Usage:
-- SELECT * FROM vw_MedicationPopularity LIMIT 5;
-- This returns the top 5 most prescribed medications
--
-- Connected to:
-- - medications table (base medication data)
-- - prescription_item table (usage tracking)
-- - Used by: GET /api/medications/top-5 endpoint
-- ============================================================

CREATE VIEW vw_MedicationPopularity AS
SELECT 
    m.medication_id,
    m.name,
    m.stock_quantity,
    m.unit_price,
    COUNT(pi.prescription_item_id) AS usage_count
FROM medications m
LEFT JOIN prescription_item pi ON m.medication_id = pi.medication_id
GROUP BY m.medication_id, m.name, m.stock_quantity, m.unit_price
ORDER BY usage_count DESC;