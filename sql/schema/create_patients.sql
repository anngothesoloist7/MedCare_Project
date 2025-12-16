-- CREATE PATIENTS TABLE (CHILDREN OF USERS)
-- This table stores additional information specific to patients
-- Schema based on the ERD and requirements:
-- - patient_id: Primary key, references users table
-- - age: Age of the patient
-- - height: Height of the patient (in meters, decimal for precision)
-- - sex: enum field for female, male, other

CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(50) PRIMARY KEY,
    age INT NOT NULL,
    height DECIMAL(3, 2) NOT NULL,
    sex ENUM("male", "female", "other") NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);