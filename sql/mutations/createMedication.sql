-- Create a new medication record
-- Parameters: name, description, stock_quantity, unit_price
-- medication_id is auto-generated (auto-increment INT)
-- 
-- Usage in TypeScript:
-- executeMutation('mutations/createMedication.sql', [name, description, stock_quantity, unit_price])
--
-- Returns: Result object with affectedRows and insertId (contains the auto-generated medication_id)

INSERT INTO medications 
    (name, description, stock_quantity, unit_price)
VALUES 
    (?, ?, ?, ?);
