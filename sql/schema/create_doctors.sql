-- CREATE DOCTORS TABLE (CHILDREN OF USERS)
-- This table stores additional information specific to doctors
-- Schema based on the ERD and requirements:
-- - doctor_id: Primary key, references users table

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(50) PRIMARY KEY,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;