-- ============================================================
-- Table: diagnosis
-- ============================================================
-- Purpose: Core transaction table for medical consultations
-- Records each diagnosis/consultation between a doctor and patient
--
-- Design Notes:
-- - diagnosis_id is AUTO_INCREMENT INTEGER
-- - doctor_id and patient_id are foreign keys to users table
-- - date is automatically set to current timestamp
-- - next_checkup is optional (can be NULL)
-- - Indexed on patient_id, doctor_id, and date for fast queries
--
-- Connected to:
-- - users table (doctor_id and patient_id foreign keys)
-- - prescription_item table (diagnosis_id foreign key)
-- - Protected by trigger: trg_Prevent_Diagnosis_Deletion
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnosis (
    -- Primary key: Auto-incrementing ID
    diagnosis_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign keys to users table
    doctor_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    
    -- Diagnosis information
    diagnosis TEXT NOT NULL,
    date DATE DEFAULT (CURRENT_DATE),
    next_checkup DATE,
    
    -- Audit timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_diagnosis_doctor 
        FOREIGN KEY (doctor_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_diagnosis_patient 
        FOREIGN KEY (patient_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT chk_next_checkup_future CHECK (next_checkup IS NULL OR next_checkup >= DATE(date))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Confirm table creation
SELECT 'Table diagnosis created successfully' AS status;
