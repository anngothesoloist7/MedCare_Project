-- CREATE DIAGNOSIS TABLE
-- This table stores diagnosis records made by doctors for patients
-- Schema based on the ERD and requirements:
-- - diagnosis_id: Primary key
-- - doctor_id: Foreign key referencing doctors table
-- - diagnosis: Text field for diagnosis details
-- - patient_id: Foreign key referencing patients table
-- - date: Timestamp when the diagnosis was made
-- - next_checkup: Date for the next checkup appointment

CREATE TABLE IF NOT EXISTS diagnosis (
    diagnosis_id VARCHAR(50) PRIMARY KEY,
    doctor_id VARCHAR(50) NOT NULL,
    diagnosis TEXT,
    patient_id VARCHAR(50) NOT NULL,
    date DATETIME,
    next_checkup DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    -- Index on doctor_id and patient_id for faster lookups
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_patient_id (patient_id)
);

-- Partitioning by Range (Year) for Long-term Scalability
ALTER TABLE diagnosis 
PARTITION BY RANGE (YEAR(date)) (
    PARTITION p_history VALUES LESS THAN (2025), -- Archived data (Pre-2025)
    PARTITION p_current VALUES LESS THAN (2026), -- Active data (2025)
    PARTITION p_future VALUES LESS THAN MAXVALUE -- Future expansion
);
