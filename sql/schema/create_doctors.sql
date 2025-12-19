-- CREATE DOCTORS TABLE (CHILDREN OF USERS)
-- This table stores additional information specific to doctors
-- Schema based on the ERD and requirements:
-- - doctor_id: Primary key, references users table

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(50) PRIMARY KEY,
    speciality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);