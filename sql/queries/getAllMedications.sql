-- Get all medications from the medications table
-- Used by doctors when selecting medications for prescriptions
-- 
-- Usage in TypeScript:
-- executeQuery('queries/getAllMedications.sql')
--
-- Returns: Array of medication objects with current stock quantities

SELECT 
  medication_id,
  name,
  description,
  stock_quantity,
  unit_price,
  created_at,
  updated_at
FROM medications
ORDER BY name ASC;

