-- Get all medications from the medications table
-- This query is used to verify that data was successfully inserted into the database
-- 
-- Usage in TypeScript:
-- executeQuery('queries/getAllMedications.sql')
--
-- Returns: Array of medication objects with all fields

SELECT 
  medication_id,
  name,
  description,
  stock_quantity,
  unit_price,
  created_at
FROM medications
ORDER BY created_at DESC;

