-- Insert a new medication into the medications table
-- This mutation is used to test the database connection between Next.js and Railway MySQL
-- 
-- Parameters (in order):
-- 1. name (VARCHAR) - Name of the medication
-- 2. description (TEXT) - Description of the medication
-- 3. stock_quantity (INT) - Current stock quantity
-- 4. unit_price (DECIMAL) - Price per unit
--
-- Usage in TypeScript:
-- executeMutation('mutations/insertMedication.sql', [name, description, stockQuantity, unitPrice])
--
-- Returns: Result object with insertId (the ID of the newly created medication)

INSERT INTO medications (
  name,
  description,
  stock_quantity,
  unit_price,
  created_at
) VALUES (
  ?,
  ?,
  ?,
  ?,
  NOW()
);

