-- Get 5 medications with lowest stock quantity
-- Used for stock warning display
-- Returns medication_id, name, stock_quantity, and unit_price
-- 
-- Usage in TypeScript:
-- executeQuery('queries/getLowest5StockedMedications.sql')
--
-- Returns: Array of medication objects with lowest stock quantities

SELECT 
    medication_id,
    name,
    stock_quantity,
    unit_price
FROM medications
ORDER BY stock_quantity ASC
LIMIT 5;
