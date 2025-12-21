-- Update medication stock quantity and unit price only
-- Parameters: stock_quantity, unit_price, medication_id
-- Only updates stock_quantity and unit_price (name and description cannot be updated)
-- 
-- Usage in TypeScript:
-- executeMutation('mutations/updateMedicationStock.sql', [stock_quantity, unit_price, medication_id])
--
-- Returns: Result object with affectedRows

UPDATE medications
SET 
    stock_quantity = ?,
    unit_price = ?
WHERE medication_id = ?;
