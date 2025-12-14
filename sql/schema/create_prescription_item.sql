-- CREATE PRESCRIPTION_ITEM TABLE
-- This table stores prescription records linked to diagnoses
-- Schema based on the ERD and requirements:
-- - prescriptionitem_id: Primary key
-- - diagnosis_id: Foreign key referencing diagnosis table
-- - quantity: Quantity of medication prescribed
-- - guide: Text field for usage guide
-- - duration: Duration for which the medication is prescribed
-- medication_id: Foreign key referencing medications table

CREATE TABLE IF NOT EXISTS prescription_item (
    prescriptionitem_id VARCHAR(50) PRIMARY KEY,
    diagnosis_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    guide TEXT,
    duration TEXT,
    medication_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medications(medication_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnosis(diagnosis_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;