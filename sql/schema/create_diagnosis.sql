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
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_checkup DATE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    -- Index on doctor_id and patient_id for faster lookups
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_patient_id (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;