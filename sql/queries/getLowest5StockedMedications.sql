-- ============================================================
-- Query: getLowest5StockedMedications.sql
-- ============================================================
-- Purpose: Get 5 medications with lowest stock quantity
-- This query now uses the vw_LowStockMedications view
--
-- Why using a view:
-- Instead of repeating the ORDER BY logic here,
-- we query the vw_LowStockMedications view which already has
-- the ordering built in. This provides:
-- 1. Better maintainability - change ordering logic in one place
-- 2. Consistency - all low stock queries use same logic
-- 3. Cleaner code - the query is simple and readable
--
-- The view already orders by stock_quantity ASC, so we just LIMIT 5
--
-- Parameters: None
--
-- Returns:
-- - medication_id: Primary key (INT)
-- - name: Medication name (VARCHAR)
-- - stock_quantity: Current stock level (INT)
-- - unit_price: Price per unit (DECIMAL 10,2)
--
-- Connected to:
-- - vw_LowStockMedications view (source data)
-- - Used by: GET /api/medications/low-stock endpoint
-- ============================================================

SELECT 
    medication_id,
    name,
    stock_quantity,
    unit_price
FROM vw_LowStockMedications
LIMIT 5;
