-- CREATE USERS TABLE
-- This table stores user information for both doctors and patients
-- Schema based on the ERD and requirements:
-- - user_id: Primary key
-- - nid_number: National ID number (required)
-- - phone: Phone number (required)
-- - role: enum field for doctor or patient
-- - dob: Date of birth
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    nid_number INT NOT NULL,
    phone INT NOT NULL,
    role ENUM("doctor", "patient") NOT NULL,
    dob DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Index on national ID and phone for faster lookups
    INDEX idx_nid_number (nid_number),
    INDEX idx_phone (phone)
);