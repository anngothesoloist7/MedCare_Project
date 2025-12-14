-- Create medications table
-- This table stores the medication catalog for the MedCare system
-- 
-- Schema based on the ERD and requirements:
-- - medication_id: Primary key, auto-increment
-- - name: Medication name (required)
-- - description: Optional description of the medication
-- - stock_quantity: Current stock quantity (non-negative integer)
-- - unit_price: Price per unit (decimal, for financial accuracy per NFR-01)
-- - created_at: Timestamp when the record was created
-- - updated_at: Timestamp when the record was last updated
--
-- This table is referenced by PrescriptionsItem table (foreign key: medication_id)
-- Indexes are added for performance optimization (NFR-03)

CREATE TABLE IF NOT EXISTS medications (
  medication_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Index on name for faster lookups (mentioned in NFR-03)
  INDEX idx_medication_name (name),
  
  -- Index on stock_quantity for inventory queries
  INDEX idx_stock_quantity (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;