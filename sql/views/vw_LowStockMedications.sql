-- ============================================================
-- View: vw_LowStockMedications
-- ============================================================
-- Purpose: Shows medications ordered by stock quantity (ascending)
-- This view replaces the direct query in getLowest5StockedMedications.sql
--
-- Why this view exists:
-- Provides a consistent way to query low-stock medications.
-- The view handles the ordering logic, so consumers just need to
-- apply a LIMIT to get the desired number of low-stock items.
--
-- Columns:
-- - medication_id: Primary key from medications table (INT)
-- - name: Medication name (VARCHAR)
-- - stock_quantity: Current stock level - sorted ascending (INT)
-- - unit_price: Price per unit (DECIMAL 10,2)
--
-- Usage:
-- SELECT * FROM vw_LowStockMedications LIMIT 5;
-- This returns the 5 medications with lowest stock
--
-- Connected to:
-- - medications table (source data)
-- - Used by: GET /api/medications/low-stock endpoint
-- ============================================================

CREATE VIEW vw_LowStockMedications AS
SELECT 
    medication_id,
    name,
    stock_quantity,
    unit_price
FROM medications
ORDER BY stock_quantity ASC;
