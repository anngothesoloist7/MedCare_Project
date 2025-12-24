-- ============================================================
-- Table: medications
-- ============================================================
-- Purpose: Catalog of all available medications with inventory tracking
-- Stores medication details, stock levels, and pricing information
--
-- Design Notes:
-- - medication_id is AUTO_INCREMENT INTEGER for simplicity
-- - name is indexed for fast medication search
-- - stock_quantity is tracked for inventory management
-- - unit_price uses DECIMAL(10,2) for precise monetary values
-- - description is optional (can be NULL)
--
-- Connected to:
-- - prescription_item table (medication_id foreign key)
-- - Used by: medication management features, stock tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS medications (
    -- Primary key: Auto-incrementing ID
    medication_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Medication information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Inventory tracking
    stock_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Audit timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT uq_medication_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Confirm table creation
SELECT 'Table medications created successfully' AS status;
