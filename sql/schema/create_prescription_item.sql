-- ============================================================
-- Table: prescription_item
-- ============================================================
-- Purpose: Junction table linking diagnoses to prescribed medications
-- Represents the many-to-many relationship between diagnosis and medications
--
-- Design Notes:
-- - prescription_item_id is AUTO_INCREMENT INTEGER
-- - diagnosis_id and medication_id are foreign keys
-- - quantity must be positive (enforced by CHECK constraint)
-- - guide and duration store medication instructions
-- - Indexed on diagnosis_id and medication_id for fast lookups
--
-- Connected to:
-- - diagnosis table (diagnosis_id foreign key)
-- - medications table (medication_id foreign key)
-- - Trigger: trg_AfterInsert_PrescriptionItem (decrements stock)
-- - Trigger: trg_Prevent_Prescription_Deletion (prevents deletion)
-- ============================================================

CREATE TABLE IF NOT EXISTS prescription_item (
    -- Primary key: Auto-incrementing ID
    prescription_item_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign keys
    diagnosis_id INT NOT NULL,
    medication_id INT NOT NULL,
    
    -- Prescription details
    quantity INT NOT NULL,
    guide TEXT NOT NULL,
    duration VARCHAR(255) NOT NULL,
    
    -- Audit timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_prescription_diagnosis 
        FOREIGN KEY (diagnosis_id) REFERENCES diagnosis(diagnosis_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescription_medication 
        FOREIGN KEY (medication_id) REFERENCES medications(medication_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Confirm table creation
SELECT 'Table prescription_item created successfully' AS status;
